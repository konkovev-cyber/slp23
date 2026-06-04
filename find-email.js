import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function findByEmail() {
    const email = 'kiyannnd@slp23.ru';
    console.log(`Searching specifically for email: ${email}...`);

    const { data: { user }, error } = await supabase.auth.admin.getUserByEmail(email);

    if (error) {
        console.error('❌ Error (likely not found):', error.message);
    } else if (user) {
        console.log(`✅ FOUND! ID: ${user.id}`);
    } else {
        console.log(`❓ Not found but no error.`);
    }
}

findByEmail();
