import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Test with a completely fresh email (no profile exists) to confirm the trigger issue
async function diagnose() {
    const freshEmail = `test_fresh_${Date.now()}@slp23.ru`;
    console.log(`Testing with fresh email (no profile): ${freshEmail}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email: freshEmail,
        password: 'test123456',
        email_confirm: true
    });

    if (error) {
        console.error('❌ FRESH email also fails! Error:', error.message);
        console.log('\nThis suggests a DATABASE-LEVEL TRIGGER is broken.');
        console.log('The trigger that runs on auth.users INSERT is likely referencing a missing column or function.');
    } else {
        console.log(`✅ Fresh email works. User ID: ${data.user.id}`);
        console.log('\nChecking if profile was auto-created...');
        await new Promise(r => setTimeout(r, 1000));
        const { data: p } = await supabase.from('profiles').select('*').eq('auth_id', data.user.id).maybeSingle();
        console.log('Auto-profile:', p ? JSON.stringify(p) : 'NOT created');

        // Cleanup
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('🗑️  Cleaned up.');
    }
}

diagnose();
