import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function invite() {
    const email = 'kiyannnd@slp23.ru';
    console.log(`Inviting user: ${email}...`);

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Success! User invited with ID: ${data.user.id}`);
    }
}

invite();
