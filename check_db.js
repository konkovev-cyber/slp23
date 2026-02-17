import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (error) {
        console.error('Error fetching tables:', error);
        return;
    }

    console.log('Existing tables:');
    data.forEach((t: any) => console.log('- ' + t.table_name));

    const requiredTables = ['posts', 'post_media', 'profiles', 'user_roles'];
    requiredTables.forEach(rt => {
        if (!data.some((t: any) => t.table_name === rt)) {
            console.warn(`WARNING: Table "${rt}" is missing!`);
        } else {
            console.log(`OK: Table "${rt}" exists.`);
        }
    });
}

checkTables();
