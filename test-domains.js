import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    // Try gmail to see if it's domain-specific
    const tests = [
        `test_${Date.now()}@gmail.com`,
        `test_${Date.now()}@mail.ru`,
        `test_${Date.now()}@slp23.ru`,
    ];

    for (const email of tests) {
        const { data, error } = await supabase.auth.admin.createUser({
            email, password: 'test123456', email_confirm: true
        });
        if (error) {
            console.log(`❌ [${email}] ${error.message}`);
        } else {
            console.log(`✅ [${email}] OK -> ${data.user.id}`);
            await supabase.auth.admin.deleteUser(data.user.id);
        }
    }
}

test();
