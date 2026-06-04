import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser(email) {
    console.log(`\n🔍 Checking details for: ${email}`);

    // 1. Auth Users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData.users.find(u => u.email === email);
    if (!authUser) {
        console.log(`❌ Auth User NOT FOUND for ${email}`);
        return;
    }
    console.log(`✅ Auth User EXISTS (ID: ${authUser.id})`);

    // 2. Profile
    const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('auth_id', authUser.id).single();
    if (pErr || !profile) {
        console.log(`❌ Profile NOT FOUND for auth_id: ${authUser.id}`);
    } else {
        console.log(`✅ Profile: Role="${profile.role}" (Approved: ${profile.is_approved})`);
    }

    // 3. User Roles
    const { data: role, error: rErr } = await supabase.from('user_roles').select('*').eq('user_id', authUser.id).single();
    if (rErr || !role) {
        console.log(`❌ user_roles entry NOT FOUND for user_id: ${authUser.id}. This is critical for RLS policies!`);
    } else {
        console.log(`✅ user_roles: Role="${role.role}"`);
    }

    // 4. Students Info
    if (profile?.role === 'student' || role?.role === 'student') {
        const { data: sInfo, error: sErr } = await supabase.from('students_info').select('*, school_classes(name)').eq('student_id', authUser.id).single();
        if (sErr || !sInfo) {
            console.log(`❌ students_info NOT FOUND. User is not assigned to any class!`);
        } else {
            console.log(`✅ students_info: Class ID=${sInfo.class_id} (Name: ${sInfo.school_classes?.name || 'Unknown'})`);
        }
    }
    console.log(`-------------------------------------------------\n`);
}

checkUser('kiyannd@slp23.ru');
