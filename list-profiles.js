import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function listProfiles() {
    console.log(`Fetching all profiles...`);
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`Count: ${profiles.length}`);
    profiles.forEach(p => {
        console.log(`- ${p.email || 'NO EMAIL'} (AuthID: ${p.auth_id || 'NULL'}, Role: ${p.role})`);
    });
}

listProfiles();
