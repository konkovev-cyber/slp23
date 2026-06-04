import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function findOrphans() {
    const oldId = '92a35823-8bd3-4958-b1b3-4cdcea239af8';
    console.log(`Checking for orphans of ID: ${oldId}...`);

    const { data: sInfo } = await supabase.from('students_info').select('*').eq('student_id', oldId);
    console.log(`- students_info: ${sInfo?.length || 0}`);

    const { data: uRoles } = await supabase.from('user_roles').select('*').eq('user_id', oldId);
    console.log(`- user_roles: ${uRoles?.length || 0}`);

    const { data: pChild } = await supabase.from('parents_children').select('*').or(`child_id.eq.${oldId},parent_id.eq.${oldId}`);
    console.log(`- parents_children: ${pChild?.length || 0}`);

    const { data: profiles } = await supabase.from('profiles').select('*').eq('auth_id', oldId);
    console.log(`- profiles: ${profiles?.length || 0}`);
}

findOrphans();
