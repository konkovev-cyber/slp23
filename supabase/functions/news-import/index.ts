import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supports plain text containing image URLs (VK/Telegram exports often include direct links)
function extractFirstImageUrl(content: string): string | null {
  const text = content ?? "";
  // Prefer common image extensions.
  const re = /(https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif))(?:\?[^\s"'<>]*)?/i;
  const m = text.match(re);
  return m?.[1] ?? null;
}

const postSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  content: z.string().min(1),
  excerpt: z.string().max(1000).nullable().optional(),
  published_at: z.string().optional(), // ISO string
  image_url: z.string().url().nullable().optional(),
  source: z.string().max(50).nullable().optional(),
  source_id: z.string().max(200).nullable().optional(),
});

const payloadSchema = z.object({
  posts: z.array(postSchema).min(1).max(200),
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
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticated caller required (admin).
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const callerId = userData?.user?.id;
  if (userErr || !callerId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const service = createClient(supabaseUrl, serviceRoleKey);
  const { data: roleRow } = await service
    .from("user_roles")
    .select("id")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
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

  const { posts } = parsed.data;

  const results: Array<{ slug: string; action: "inserted" | "updated"; image_url: string | null }> = [];

  for (const p of posts) {
    const computedImage =
      (p.image_url ?? null) ?? extractFirstImageUrl(p.content) ?? null;

    const payload = {
      title: p.title,
      slug: p.slug,
      category: p.category,
      content: p.content,
      excerpt: p.excerpt ?? null,
      image_url: computedImage,
      source: p.source ?? null,
      source_id: p.source_id ?? null,
      ...(p.published_at ? { published_at: p.published_at } : {}),
    };

    // Dedup strategy:
    // 1) source+source_id when present
    // 2) otherwise by slug
    const lookup = p.source_id
      ? service
          .from("posts")
          .select("id")
          .eq("source", p.source ?? null)
          .eq("source_id", p.source_id)
          .maybeSingle()
      : service.from("posts").select("id").eq("slug", p.slug).maybeSingle();

    const { data: existing, error: findErr } = await lookup;
    if (findErr) {
      return new Response(JSON.stringify({ error: findErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing?.id) {
      const { error: updErr } = await service
        .from("posts")
        .update(payload)
        .eq("id", existing.id);
      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      results.push({ slug: p.slug, action: "updated", image_url: computedImage });
    } else {
      const { error: insErr } = await service.from("posts").insert(payload);
      if (insErr) {
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      results.push({ slug: p.slug, action: "inserted", image_url: computedImage });
    }
  }

  return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
