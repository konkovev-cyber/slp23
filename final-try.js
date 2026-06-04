import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function finalTry() {
    const email = 'kiyannnd@slp23.ru';
    console.log(`Final attempt for: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });

    if (error) {
        console.log('❌ Error Object:', JSON.stringify(error, null, 2));
    } else {
        console.log(`✅ Success! ID: ${data.user.id}`);
    }
}

finalTry();
