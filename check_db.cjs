const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
function parseEnv(filePath) {
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
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    // Information schema might restricted even for service role in some configs,
    // let's try a direct query to posts
    try {
        const { error: postsErr } = await supabase.from('posts').select('id').limit(1);
        if (postsErr) {
            console.warn('Posts table error:', postsErr.message);
        } else {
            console.log('OK: Table "posts" exists.');
        }

        const { error: mediaErr } = await supabase.from('post_media').select('id').limit(1);
        if (mediaErr) {
            console.warn('Post_media table error:', mediaErr.message);
        } else {
            console.log('OK: Table "post_media" exists.');
        }

        const { error: rolesErr } = await supabase.from('user_roles').select('id').limit(1);
        if (rolesErr) {
            console.warn('User_roles table error:', rolesErr.message);
        } else {
            console.log('OK: Table "user_roles" exists.');
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

checkTables();
