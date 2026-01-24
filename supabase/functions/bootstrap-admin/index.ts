// Lovable Cloud backend function: create the FIRST admin user.
// Safety: only works when there are no admins yet (user_roles.role='admin').

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const payloadSchema = z.object({
  email: z.string().trim().email().max(255),
  // password is only required if we need to CREATE the user.
  password: z.string().min(8).max(128).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const service = createClient(supabaseUrl, serviceRoleKey);

  // Allow only if there are no admins yet.
  const { count, error: countErr } = await service
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (countErr) {
    return new Response(JSON.stringify({ error: "Failed to verify admin status" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ error: "Bootstrap is disabled" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  // If the account already exists, promote it. Otherwise create and promote.
  const perPage = 100;
  let page = 1;
  let found: { id: string; email?: string } | null = null;
  while (page <= 20) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const users = data?.users ?? [];
    found = users.find((u) => (u.email ?? "").toLowerCase() === email) ?? null;
    if (found) break;
    if (users.length < perPage) break;
    page += 1;
  }

  let newUserId: string;

  if (found?.id) {
    newUserId = found.id;
  } else {
    if (!password) {
      return new Response(JSON.stringify({ error: "Password is required to create a new user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "Failed to create user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    newUserId = created.user.id;
  }
  const { error: roleErr } = await service.from("user_roles").insert({
    user_id: newUserId,
    role: "admin",
  });

  if (roleErr) {
    return new Response(
      JSON.stringify({ error: `User created, but role assign failed: ${roleErr.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ userId: newUserId, email }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
