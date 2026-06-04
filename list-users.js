import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function listAllUsers() {
    console.log(`Listing all users...`);
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`Count: ${users.users.length}`);
    users.users.forEach(u => {
        console.log(`- ${u.email} (Confirmed: ${!!u.email_confirmed_at})`);
    });
}

listAllUsers();
