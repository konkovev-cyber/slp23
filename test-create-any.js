import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createOtherUser() {
    const email = 'kiyannnd_test@slp23.ru';
    const password = 'password123';

    console.log(`Creating test user: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Тестовый аккаунт' }
    });

    if (error) {
        console.error('❌ Error creating user:', error.message);
    } else {
        console.log(`✅ User created successfully! ID: ${data.user.id}`);
        // Clean up
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log(`🗑️  Test user deleted.`);
    }
}

createOtherUser();
