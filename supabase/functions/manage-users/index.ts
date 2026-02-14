import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { email, password, full_name, role } = await req.json();

        // 1. Create the user in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || "temp123456",
            email_confirm: true,
            user_metadata: { full_name }
        });

        if (authError) throw authError;

        const user = authData.user;

        // 2. Create the profile
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                auth_id: user.id,
                full_name: full_name,
                email: email,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${full_name}`
            }, { onConflict: 'auth_id' });

        if (profileError) throw profileError;

        // 3. Assign the role
        const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: user.id, role: role || "student" }, { onConflict: 'user_id' });

        if (roleError) throw roleError;

        return new Response(JSON.stringify({ success: true, user_id: user.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
