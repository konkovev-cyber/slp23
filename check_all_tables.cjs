const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.match(/^\s*([^=]+)\s*=\s*["']?([^"'\r\n]+)["']?\s*$/);
        if (parts) env[parts[1]] = parts[2];
    });
    return env;
}

const env = parseEnv(path.join(__dirname, '.env'));
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAllTables() {
    const tables = [
        'posts', 'post_media', 'profiles', 'user_roles',
        'school_classes', 'subjects', 'schedule', 'homework',
        'grades', 'site_content', 'site_settings'
    ];

    console.log(`Checking tables in ${SUPABASE_URL}...`);

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
            if (error.code === '42P01') {
                console.log(`[MISSING] ${table}`);
            } else {
                console.log(`[ERROR]   ${table}: ${error.message} (${error.code})`);
            }
        } else {
            console.log(`[PRESENT] ${table}`);
        }
    }
}

checkAllTables();
