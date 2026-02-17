const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwuicyhadpesklhkjxpn.supabase.co';
const serviceRoleKey = 'sb_secret_HzH8nQFmVqlvM95VQGoJnQ_y2FfA5vC';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    const { data, error } = await supabase.from('site_content').select('id, section_name, is_visible');
    if (error) {
        console.error(error);
    } else {
        console.log('--- SITE CONTENT SECTIONS ---');
        data.forEach(s => {
            console.log(`[${s.id}] Name: ${s.section_name}, Visible: ${s.is_visible}`);
        });
        console.log('-----------------------------');
    }
}

check();
