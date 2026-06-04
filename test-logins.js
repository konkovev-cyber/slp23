import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY // using anon key to simulate real login
);

async function testLogins() {
    const tests = [
        { email: 'admin@slp23.ru', pwd: 'password123' },
        { email: 'admin@slp23.ru', pwd: 'Ss123123' }, // the password in check_db.js
        { email: 'kiyannd@slp23.ru', pwd: 'password123' },
        { email: 'slichnost5@mail.ru', pwd: 'password123' },
    ];

    console.log("🚀 Testing Logins...");
    for (const t of tests) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: t.email,
            password: t.pwd,
        });

        if (error) {
            console.log(`❌ Login failed for [${t.email}] with pwd [${t.pwd}]: ${error.message} (Status: ${error.status})`);
        } else {
            console.log(`✅ Login SUCCESS for [${t.email}] with pwd [${t.pwd}]! Session: ${!!data.session}`);
            // Check if profile exists for this user
            const { data: p, error: pErr } = await supabase.from('profiles').select('role, is_approved').eq('auth_id', data.user.id).single();
            if (pErr) {
                console.log(`   ⚠️ Cannot fetch profile: ${pErr.message}`);
            } else {
                console.log(`   📄 Profile: Role=${p.role}, Approved=${p.is_approved}`);
            }
        }
    }
}

testLogins();
