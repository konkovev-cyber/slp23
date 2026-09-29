import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const db = createClient(supabaseUrl, serviceRoleKey);

  try {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Honeypot: поле только для ботов — тихо отбрасываем
    if (String(body.company_website ?? "").trim() !== "") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const childAge = String(body.child_age ?? "").trim();
    const message = String(body.message ?? "").trim();

    const errors: Record<string, string> = {};
    if (name.length < 2 || name.length > 200) errors.name = "Имя обязательно";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) errors.phone = "Введите корректный телефон";
    if (email && (email.length > 200 || !EMAIL_RE.test(email))) errors.email = "Введите корректный email";
    if (childAge.length > 50) errors.child_age = "Слишком длинное значение";
    if (message.length > 2000) errors.message = "Слишком длинное сообщение";

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({ error: "Validation failed", fields: errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await db.from("contact_requests").insert({
      name,
      phone,
      email: email || null,
      child_age: childAge || null,
      message: message || null,
      source: "web",
    });
    if (insErr) {
      return new Response(JSON.stringify({ error: `DB error: ${insErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[Contact Request] Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
