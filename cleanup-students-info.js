import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function cleanupStudentsInfo() {
    const oldId = '92a35823-8bd3-4958-b1b3-4cdcea239af8';
    console.log(`Cleaning up students_info for ID: ${oldId}...`);

    const { error } = await supabase.from('students_info').delete().eq('student_id', oldId);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ students_info cleaned up.`);
    }
}

cleanupStudentsInfo();
