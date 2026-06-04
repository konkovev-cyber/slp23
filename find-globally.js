import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function findGlobally() {
    const search = 'kiyannnd';
    console.log(`Searching globally for "${search}"...`);

    const tables = [
        'grades', 'homework', 'homework_completions', 'homework_files',
        'navigation_items', 'parents_children', 'post_media', 'posts',
        'profiles', 'schedule', 'school_classes', 'site_content',
        'site_settings', 'students_info', 'subjects', 'teacher_assignments',
        'user_roles'
    ];

    for (const table of tables) {
        // Try searching in all columns (assuming they might have email or name)
        // This is a bit rough but with apikey we can do it
        const { data, error } = await supabase.from(table).select('*');
        if (error) continue;

        const matches = data.filter(row => JSON.stringify(row).toLowerCase().includes(search));
        if (matches.length > 0) {
            console.log(`✅ Table [${table}] has ${matches.length} matches!`);
            console.log(JSON.stringify(matches, null, 2));
        }
    }
    console.log('Search finished.');
}

findGlobally();
