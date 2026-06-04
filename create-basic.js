import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createBasic() {
    const email = 'kiyannnd@slp23.ru';
    const password = 'password123';

    console.log(`Creating basic user: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password
    });

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Success! ID: ${data.user.id}`);
    }
}

createBasic();
