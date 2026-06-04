import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchedule() {
    console.log("🔍 Checking schedule and assignments...");

    const { data: schedule } = await supabase.from('schedule').select('*');
    console.log(`- Schedule entries: ${schedule?.length || 0}`);

    const { data: assignments } = await supabase.from('teacher_assignments').select('*');
    console.log(`- Teacher assignments: ${assignments?.length || 0}`);

    const { data: dbGrades } = await supabase.from('grades').select('*');
    console.log(`- Grades: ${dbGrades?.length || 0}`);

    const { data: homework } = await supabase.from('homework').select('*');
    console.log(`- Homeworks: ${homework?.length || 0}`);
}

checkSchedule();
