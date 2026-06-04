import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Генерация простого, но уникального пароля (6 символов без похожих букв O/0, I/l)
function generatePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 6; i++) {
        pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    return pwd;
}

async function run() {
    console.log("🚀 Генерация уникальных паролей для пользователей...");

    // 1. Получаем всех пользователей
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
        console.error("❌ Ошибка получения пользователей Auth:", error.message);
        return;
    }

    // 2. Получаем профили для привязки ФИО
    const { data: profiles } = await supabase.from('profiles').select('auth_id, full_name, role');
    const profileMap = new Map((profiles || []).map(p => [p.auth_id, p]));

    const credentials = [];
    let failed = 0;

    for (const u of users) {
        // Пропускаем главного админа и левые почты
        if (u.email === 'admin@slp23.ru' || !u.email.endsWith('@slp23.ru')) {
            console.log(`⏭️ Пропущен системный аккаунт: ${u.email}`);
            continue;
        }

        const pwd = generatePassword();
        const profile = profileMap.get(u.id);
        const name = profile?.full_name || u.email;
        let roleName = profile?.role || 'Неизвестно';
        if (roleName === 'teacher') roleName = 'Учитель';
        if (roleName === 'student') roleName = 'Ученик';

        // Обновляем пароль в Supabase
        const { error: updErr } = await supabase.auth.admin.updateUserById(u.id, { password: pwd });

        if (!updErr) {
            credentials.push({
                'Роль': roleName,
                'ФИО': name,
                'Логин (Email)': u.email,
                'Пароль': pwd
            });
            console.log(`✅ Сгенерирован пароль для ${u.email}`);
        } else {
            console.error(`❌ Ошибка обновления ${u.email}: ${updErr.message}`);
            failed++;
        }
    }

    if (credentials.length > 0) {
        // Сортируем: сначала учителя, потом ученики
        credentials.sort((a, b) => a['Роль'].localeCompare(b['Роль']) || a['ФИО'].localeCompare(b['ФИО']));

        // Создаем Excel файл
        const ws = xlsx.utils.json_to_sheet(credentials);

        // Настраиваем ширину столбцов
        ws['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 25 }, { wch: 12 }];

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Логины и Пароли");
        const filename = "Логины_и_Пароли.xlsx";
        xlsx.writeFile(wb, filename);

        console.log(`\n─────────────────────────────────────────`);
        console.log(`📁 Файл '${filename}' успешно создан!`);
        console.log(`В нём ${credentials.length} аккаунтов. Распечатайте его и раздайте ученикам/учителям.`);
    }

    if (failed > 0) {
        console.log(`⚠️ Не удалось обновить ${failed} аккаунтов.`);
    }
}

run();
