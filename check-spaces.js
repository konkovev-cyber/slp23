import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSpaces() {
    console.log(`Checking for emails with spaces or similar...`);
    const { data: profiles, error } = await supabase.from('profiles').select('email');
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    profiles.forEach(p => {
        if (p.email?.toLowerCase().includes('kiyannnd')) {
            console.log(`- MATCH! Email: [${p.email}] (Length: ${p.email.length})`);
        }
    });
    console.log('Search finished.');
}

checkSpaces();
