import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createUser() {
    const email = 'kiyannnd@slp23.ru';
    const password = 'password123';

    console.log(`Creating user: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Пользователь (Тест)' }
    });

    if (error) {
        console.error('❌ Error creating user:', error.message);
        return;
    }

    const userId = data.user.id;
    console.log(`✅ User created. ID: ${userId}`);

    // Create profile
    const { error: profileError } = await supabase.from('profiles').upsert({
        auth_id: userId,
        email: email,
        full_name: 'Пользователь (Тест)',
        role: 'student',
        is_approved: true
    });

    if (profileError) {
        console.error('❌ Error creating profile:', profileError.message);
    } else {
        console.log(`✅ Profile created and approved.`);
    }

    console.log('\n🚀 DONE. User can now log in.');
}

createUser();
