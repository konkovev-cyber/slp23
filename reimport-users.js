import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEFAULT_PASSWORD = process.argv[2] || 'password123';

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

async function reimport() {
    console.log(`🚀 Реимпорт пользователей из Журнал.json`);
    console.log(`🔑 Пароль для всех: "${DEFAULT_PASSWORD}"`);
    console.log(`─────────────────────────────────────────`);

    if (!fs.existsSync('Журнал.json')) {
        console.error('❌ Файл Журнал.json не найден. Запустите из папки проекта.');
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync('Журнал.json', 'utf8'));

    // 1. Получаем текущих auth-пользователей
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authByEmail = new Map(authUsers.map(u => [u.email?.toLowerCase(), u]));
    console.log(`🔐 Уже в Auth: ${authUsers.length} пользователей`);

    // 2. Парсим педагогов и учеников из JSON
    const teachers = [...new Set(data.map(r => r['Педагоги.']).filter(Boolean))];
    const students = [...new Set(data.map(r => r['Класс ПЛЮС 5 (список)']).filter(Boolean))];
    console.log(`📊 Педагогов: ${teachers.length}, Учеников: ${students.length}`);
    console.log(`─────────────────────────────────────────`);

    let created = 0, updated = 0, failed = 0;

    const uploadUser = async (name, role) => {
        const email = createLogin(name);
        const existingAuth = authByEmail.get(email.toLowerCase());

        if (existingAuth) {
            // Уже есть — обновить пароль
            await supabase.auth.admin.updateUserById(existingAuth.id, {
                password: DEFAULT_PASSWORD, email_confirm: true
            });
            // Обновить профиль
            await supabase.from('profiles').upsert({
                auth_id: existingAuth.id,
                email,
                full_name: name,
                role,
                is_approved: true
            });
            console.log(`🔄 [${email}] обновлён (${role})`);
            updated++;
            return existingAuth.id;
        }

        // Нет в Auth — создаём
        const { data: newUser, error } = await supabase.auth.admin.createUser({
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (error) {
            console.log(`❌ [${email}] ${error.message}`);
            failed++;
            return null;
        }

        const uid = newUser.user.id;

        // Обновляем авто-созданный профиль
        await supabase.from('profiles').update({
            full_name: name,
            email,
            role,
            is_approved: true
        }).eq('auth_id', uid);

        await supabase.from('user_roles').upsert({ user_id: uid, role }, { onConflict: 'user_id,role' });

        console.log(`✅ [${email}] создан (${role})`);
        created++;
        return uid;
    };

    // Проверяем/создаём класс
    let { data: classes } = await supabase.from('school_classes').select('*').eq('name', 'ПЛЮС 5');
    let classId;
    if (!classes || classes.length === 0) {
        const { data: newClass } = await supabase.from('school_classes').insert([{ name: 'ПЛЮС 5' }]).select();
        classId = newClass[0].id;
        console.log(`🏫 Класс "ПЛЮС 5" создан (id: ${classId})`);
    } else {
        classId = classes[0].id;
        console.log(`🏫 Класс "ПЛЮС 5" уже есть (id: ${classId})`);
    }

    // Обрабатываем учителей
    console.log(`\n👨‍🏫 Обрабатываю учителей...`);
    for (const name of teachers) {
        await uploadUser(name, 'teacher');
    }

    // Обрабатываем учеников
    console.log(`\n👨‍🎓 Обрабатываю учеников...`);
    for (const name of students) {
        const sid = await uploadUser(name, 'student');
        if (sid) {
            // Привязка к классу
            await supabase.from('students_info').upsert(
                { student_id: sid, class_id: classId },
                { onConflict: 'student_id' }
            );
        }
    }

    console.log(`\n─────────────────────────────────────────`);
    console.log(`🏁 ГОТОВО! Создано: ${created}, Обновлено: ${updated}, Ошибок: ${failed}`);
    console.log(`\n📋 Итоговый список пользователей:`);
    const { data: { users: finalUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    finalUsers.filter(u => u.email?.endsWith('@slp23.ru')).forEach(u => {
        console.log(`  - ${u.email}`);
    });
}

reimport();
