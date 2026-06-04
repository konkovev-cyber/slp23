import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signupUser() {
    const email = 'kiyannnd@slp23.ru';
    const password = 'password123';

    console.log(`Signing up user via public API: ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Киян Н.Д.',
            }
        }
    });

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Success! ID: ${data.user?.id}`);
        console.log(`   Session: ${!!data.session}`);
    }
}

signupUser();
