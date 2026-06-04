import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function cleanupProfile() {
    const email = 'kiyannnd@slp23.ru';
    console.log(`Cleaning up profile for: ${email}...`);

    const { error } = await supabase.from('profiles').delete().eq('email', email);

    if (error) {
        console.error('❌ Error cleaning up profile:', error.message);
    } else {
        console.log(`✅ Profile cleaned up.`);
    }
}

cleanupProfile();
