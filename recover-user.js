import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createAndRename() {
    const tempEmail = 'tmp_kiyannnd@slp23.ru';
    const targetEmail = 'kiyannnd@slp23.ru';
    const password = 'password123';

    console.log(`Step 1: Creating temporary user: ${tempEmail}...`);
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Киян Н.Д.' }
    });

    if (createError) {
        console.error('❌ Error creating temp user:', createError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`✅ Temp user created. ID: ${userId}`);

    console.log(`Step 2: Updating email to: ${targetEmail}...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        email: targetEmail,
        email_confirm: true
    });

    if (updateError) {
        console.error('❌ Error updating email:', updateError.message);
        // Clean up temp
        await supabase.auth.admin.deleteUser(userId);
        return;
    }

    console.log(`✅ User email updated to ${targetEmail}`);

    // Create profile
    console.log(`Step 3: Creating profile...`);
    await supabase.from('profiles').upsert({
        auth_id: userId,
        email: targetEmail,
        full_name: 'Киян Н.Д.',
        role: 'student',
        is_approved: true
    });

    console.log('🚀 SUCCESS! User is ready.');
}

createAndRename();
