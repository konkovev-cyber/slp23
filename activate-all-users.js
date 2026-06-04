import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_PASSWORD = process.argv[2] || "password123";

async function activateAll() {
    console.log("🚀 Активация пользователей (v3 — правильная стратегия)");
    console.log(`🔑 Пароль: "${DEFAULT_PASSWORD}"`);
    console.log(`─────────────────────────────────────────`);

    // 1. Получаем Auth-пользователей
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authByEmail = new Map(authUsers.map(u => [u.email?.toLowerCase(), u]));

    // 2. Получаем ВСЕ профили
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) { console.error("❌", pErr.message); return; }
    console.log(`📊 В profiles: ${profiles.length} | В Auth: ${authUsers.length}`);
    console.log(`─────────────────────────────────────────`);

    // Разбиваем на тех, кто уже в Auth, и тех, кого нет
    const noAuthProfiles = profiles.filter(p => p.email && !authByEmail.has(p.email.toLowerCase()));
    const hasAuthProfiles = profiles.filter(p => p.email && authByEmail.has(p.email.toLowerCase()));

    console.log(`✅ Уже в Auth (только сброс пароля): ${hasAuthProfiles.length}`);
    console.log(`🛠️  Нужно активировать: ${noAuthProfiles.length}`);
    console.log(`─────────────────────────────────────────`);

    let created = 0, updated = 0, failed = 0;

    // --- Сброс паролей для тех, кто уже есть ---
    for (const profile of hasAuthProfiles) {
        const email = profile.email.toLowerCase();
        const authUser = authByEmail.get(email);
        const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
            password: DEFAULT_PASSWORD, email_confirm: true
        });
        if (error) { console.log(`❌ [${email}] ${error.message}`); failed++; }
        else { console.log(`🔄 [${email}] пароль обновлён`); updated++; }
    }

    if (noAuthProfiles.length === 0) {
        console.log(`\n🏁 Готово! Создано: ${created}, Обновлено: ${updated}, Ошибок: ${failed}`);
        return;
    }

    // --- Для тех, кого нет в Auth ---
    // Шаг A: Сохранить данные и удалить ВСЕ профили без Auth за раз
    console.log(`\n📦 Сохраняю данные и удаляю ${noAuthProfiles.length} профилей для перезаписи...`);
    const savedData = noAuthProfiles.map(p => ({
        email: p.email.toLowerCase(),
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        role: p.role || 'student',
        is_approved: true,
        old_auth_id: p.auth_id,
    }));

    // Удаляем все профили без Auth (по их old_auth_id)
    for (const saved of savedData) {
        await supabase.from('profiles').delete().eq('auth_id', saved.old_auth_id);
    }
    console.log(`   ✅ Старые профили очищены.`);
    console.log(`\n🔐 Создаю Auth-аккаунты...`);

    // Шаг B: Создать Auth-пользователей (триггер сам создаст профиль)
    for (const saved of savedData) {
        const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
            email: saved.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: saved.full_name || '' }
        });

        if (authErr) {
            console.log(`❌ [${saved.email}] ${authErr.message}`);
            failed++;
            continue;
        }

        const newId = newUser.user.id;

        // Шаг C: Обновить авто-созданный профиль нужными данными
        await supabase.from('profiles').update({
            full_name: saved.full_name,
            role: saved.role,
            is_approved: true,
        }).eq('auth_id', newId);

        console.log(`✅ [${saved.email}] активирован (role: ${saved.role})`);
        created++;
    }

    console.log(`─────────────────────────────────────────`);
    console.log(`🏁 ГОТОВО! Создано: ${created}, Обновлено: ${updated}, Ошибок: ${failed}`);
}

activateAll();
