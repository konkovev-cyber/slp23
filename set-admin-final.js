import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function setAdmin() {
    const email = 'admin@slp23.ru';
    const password = 'Ss123123';

    console.log(`Setting up admin: ${email}...`);

    // 1. Delete if exists to be sure
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === email);
    if (existing) {
        await supabase.auth.admin.deleteUser(existing.id);
        console.log('   Old user deleted.');
    }

    // 2. Create fresh
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Администратор' }
    });

    if (authError) {
        console.error('❌ Auth Error:', authError.message);
        return;
    }

    const userId = authUser.user.id;
    console.log(`   User created with ID: ${userId}`);

    // 3. Profiles
    await supabase.from('profiles').upsert({
        auth_id: userId,
        email: email,
        full_name: 'Администратор',
        role: 'admin',
        is_approved: true
    });

    // 4. Roles
    await supabase.from('user_roles').upsert({
        user_id: userId,
        role: 'admin'
    });

    console.log('✅ Admin account set up successfully!');
}

setAdmin();
