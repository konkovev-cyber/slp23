import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function hardDelete() {
    const oldId = '92a35823-8bd3-4958-b1b3-4cdcea239af8';
    console.log(`Hard deleting auth user by ID: ${oldId}...`);

    const { error } = await supabase.auth.admin.deleteUser(oldId);

    if (error) {
        console.error('❌ Error hard deleting:', error.message);
    } else {
        console.log(`✅ Auth user hard deleted.`);
    }
}

hardDelete();
