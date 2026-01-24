// Lovable Cloud backend function: create a user and (optionally) assign admin role.
// Protected: requires caller to be authenticated and have 'admin' role.

import { createClient } from "npm:@supabase/supabase-js@2";

type Payload = {
  email: string;
  password: string;
  role?: "admin" | "moderator" | "user";
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const callerId = userData?.user?.id;

  if (userErr || !callerId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const service = createClient(supabaseUrl, serviceRoleKey);

  // Verify caller is admin.
  const { data: roleRow, error: roleErr } = await service
    .from("user_roles")
    .select("id")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleErr || !roleRow) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const password = payload.password ?? "";
  const role = payload.role ?? "admin";

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const newUserId = created.user.id;

  // Assign role if missing.
  const { data: existingRole } = await service
    .from("user_roles")
    .select("id")
    .eq("user_id", newUserId)
    .eq("role", role)
    .maybeSingle();

  if (!existingRole) {
    const { error: insertErr } = await service.from("user_roles").insert({
      user_id: newUserId,
      role,
    });

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: `User created, but role assign failed: ${insertErr.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response(JSON.stringify({ userId: newUserId, email, role }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
