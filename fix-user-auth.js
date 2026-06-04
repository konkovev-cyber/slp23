import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function fixUser(email, password) {
    console.log(`\n--- Обработка пользователя: ${email} ---`);

    // 1. Проверяем, есть ли такой профиль в базе
    const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (!profile) {
        // Если профиля нет, пробуем восстановить из "удаленного" состояния
        console.log(`⚠️  Профиль не найден в таблице. Создаю новый профиль...`);
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingAuth = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        let targetId = existingAuth?.id;

        if (!existingAuth) {
            console.log(`🚀 Создание учетной записи для входа...`);
            const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: 'Пользователь (Восстановлен)' }
            });
            if (authError) {
                console.error(`❌ Ошибка создания Auth: ${authError.message}`);
                return;
            }
            targetId = newUser.user.id;
        }

        const { error: insErr } = await supabase.from('profiles').upsert({
            auth_id: targetId,
            email: email,
            full_name: 'Пользователь (Восстановлен)',
            role: 'student',
            is_approved: true
        });

        if (insErr) console.error(`❌ Ошибка вставки: ${insErr.message}`);
        else console.log(`✅ Пользователь готов!`);
        return;
    }

    // 2. Проверяем, нет ли уже такого пользователя в Auth
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingAuth = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingAuth) {
        console.log(`⚠️  Аккаунт в Auth уже существует. Сбрасываем пароль...`);
        await supabase.auth.admin.updateUserById(existingAuth.id, { password, email_confirm: true });
        console.log(`✅ Пароль обновлен.`);
        return;
    }

    // 3. Создаем новый аккаунт в Auth
    console.log(`🚀 Создание учетной записи для входа...`);
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: profile.full_name }
    });

    if (authError) {
        console.error(`❌ Ошибка создания Auth: ${authError.message}`);
        return;
    }

    // 4. Привязка
    const newId = newUser.user.id;
    console.log(`🔗 Привязка профиля к новому ID: ${newId}`);

    const { error: insErr } = await supabase.from('profiles').upsert({
        ...profile,
        auth_id: newId,
        is_approved: true
    });

    if (insErr) {
        console.error(`❌ Ошибка обновления профиля: ${insErr.message}`);
    } else {
        if (profile.auth_id !== newId) {
            await supabase.from('profiles').delete().eq('auth_id', profile.auth_id);
        }
        console.log(`✅ Пользователь готов к входу!`);
    }
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Пример: node fix-user-auth.js kiyannnd@slp23.ru password123");
} else {
    fixUser(args[0], args[1] || "password123");
}
