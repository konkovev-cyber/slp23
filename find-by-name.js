import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function findByName() {
    console.log(`Searching for profiles with name containing "Киян"...`);
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%Киян%');

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`Matches: ${profiles.length}`);
    profiles.forEach(p => {
        console.log(`- ${p.email} (AuthID: ${p.auth_id}, Approved: ${p.is_approved})`);
    });
}

findByName();
