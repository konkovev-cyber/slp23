import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function listDeep() {
    console.log(`Deep listing all auth users...`);
    // List many to avoid pagination issues if any
    const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`Total Auth Users: ${users.users.length}`);
    users.users.forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Meta: ${JSON.stringify(u.user_metadata)}`);
    });
}

listDeep();
