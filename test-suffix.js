import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testSuffix() {
    const email = 'kiyannnd123@slp23.ru';
    console.log(`Testing user with suffix: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Success! ID: ${data.user.id}`);
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('🗑️  Cleaned up.');
    }
}

testSuffix();
