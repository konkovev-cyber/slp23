import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Хелпер для создания логина: ФамилияИнициалы
function createLogin(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const lastName = parts[0] ? parts[0].toLowerCase() : '';
    const initials = ((parts[1] ? parts[1][0] : '') + (parts[2] ? parts[2][0] : '')).toLowerCase();
    
    const base = lastName + initials;
    
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    
    const transliterated = base.split('').map(char => map[char] || char).join('');
    return `${transliterated.replace(/[^a-z0-9]/g, '')}@slp23.ru`;
}

async function runImport() {
    try {
        console.log('🚀 Loading data...');
        const data = JSON.parse(fs.readFileSync('Журнал.json', 'utf8'));

        console.log('🧹 Clearing all @slp23.ru users...');
        const { data: userData } = await supabase.auth.admin.listUsers();
        for (const user of userData.users) {
            if (user.email.endsWith('@slp23.ru')) {
                await supabase.auth.admin.deleteUser(user.id);
            }
        }

        // Tables to clear
        const tables = ['diary_entries', 'grades', 'schedule', 'teacher_assignments', 'students_info', 'user_roles', 'profiles', 'subjects', 'school_classes'];
        for (const t of tables) {
            await supabase.from(t).delete().neq('created_at', '1970-01-01');
        }

        console.log('🏫 Creating class...');
        const { data: classData } = await supabase.from('school_classes').insert([{ name: 'ПЛЮС 5' }]).select();
        const classId = classData[0].id;

        const teachers = [...new Set(data.map(r => r['Педагоги.']).filter(Boolean))];
        const students = [...new Set(data.map(r => r['Класс ПЛЮС 5 (список)']).filter(Boolean))];

        const userMap = {};

        const upload = async (name, role) => {
            const email = createLogin(name);
            const { data: authUser } = await supabase.auth.admin.createUser({
                email, password: 'Password123!', email_confirm: true,
                user_metadata: { full_name: name }
            });
            const userId = authUser.user.id;
            await supabase.from('profiles').insert({ auth_id: userId, email, full_name: name, role, is_approved: true });
            await supabase.from('user_roles').insert({ user_id: userId, role });
            return userId;
        };

        for (const name of teachers) userMap[name] = await upload(name, 'teacher');
        for (const name of students) {
            const sid = await upload(name, 'student');
            await supabase.from('students_info').insert({ student_id: sid, class_id: classId });
        }

        // Create Admin manually in this script as well
        const adminEmail = 'admin@slp23.ru';
        const { data: adminUser } = await supabase.auth.admin.createUser({
            email: adminEmail, password: 'Ss123123', email_confirm: true,
            user_metadata: { full_name: 'Admin' }
        });
        const aid = adminUser.user.id;
        await supabase.from('profiles').insert({ auth_id: aid, email: adminEmail, full_name: 'Admin', role: 'admin', is_approved: true });
        await supabase.from('user_roles').insert({ user_id: aid, role: 'admin' });

        console.log('✅ Final check: Listing 5 users...');
        const { data: list } = await supabase.auth.admin.listUsers();
        console.log(list.users.map(u => u.email).slice(0, 5));

    } catch (err) { console.error('❌ Error:', err.message); }
}
runImport();
