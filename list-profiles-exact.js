import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function listProfilesExact() {
    console.log(`Fetching all profiles (Exact Check)...`);
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    const match = profiles.filter(p => p.email?.toLowerCase().includes('kiyan'));
    console.log(`Potential matches found: ${match.length}`);
    match.forEach(p => {
        console.log(`- Email: "${p.email}", AuthID: ${p.auth_id}, FullName: "${p.full_name}"`);
    });
}

listProfilesExact();
