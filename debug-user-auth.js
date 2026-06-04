import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUser() {
    const email = 'kiyannnd@slp23.ru';
    const newPassword = 'password123';

    console.log(`Checking user: ${email}...`);

    // 1. Find user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('❌ Error listing users:', listError.message);
        return;
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
        console.log(`❌ User ${email} NOT FOUND in Auth.`);
        return;
    }

    console.log(`✅ User found. ID: ${user.id}`);
    console.log(`   Email confirmed: ${!!user.email_confirmed_at}`);
    console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`);

    // 2. Update user (Set password and confirm email)
    console.log(`🔄 Resetting password and confirming email...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
        email_confirm: true
    });

    if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
    } else {
        console.log(`✅ User auth updated successfully.`);
    }

    // 3. Ensure profile is approved
    const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

    if (pErr) {
        console.error('❌ Error fetching profile:', pErr.message);
    } else if (!profile) {
        console.log(`⚠️  Profile not found. Creating one...`);
        await supabase.from('profiles').insert({
            auth_id: user.id,
            email: email,
            full_name: 'Пользователь (Восстановлен)',
            role: 'student',
            is_approved: true
        });
    } else {
        console.log(`✅ Profile found. Approved: ${profile.is_approved}`);
        if (!profile.is_approved) {
            console.log(`🔄 Approving profile...`);
            await supabase.from('profiles').update({ is_approved: true }).eq('auth_id', user.id);
            console.log(`✅ Profile approved.`);
        }
    }

    console.log('\n🚀 DONE. Try logging in now.');
}

checkUser();
