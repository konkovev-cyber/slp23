import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function syncRoles() {
    console.log("🚀 Restoring Access Permissions (user_roles sync)...");

    // Fetch all profiles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) {
        console.error("❌ Failed to fetch profiles:", pErr.message);
        return;
    }

    let added = 0;

    for (const profile of profiles) {
        if (!profile.auth_id || !profile.role) continue;

        const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', profile.auth_id);
        const { error: roleErr } = await supabase.from('user_roles').insert(
            { user_id: profile.auth_id, role: profile.role }
        );

        if (roleErr) {
            console.error(`❌ Failed to assign role '${profile.role}' to ${profile.email}:`, roleErr.message);
        } else {
            added++;
        }
    }

    console.log(`\n✅ Done! Synced permissions for ${added} users.`);
}

syncRoles();
