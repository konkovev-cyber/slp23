-- ============================================================================
-- Миграция: Создание пользователя-админа
-- Версия: 2.0.0
-- Дата: 2026-02-10
-- Описание: Создание пользователя с ролью admin (минимальный набор столбцов)
-- ============================================================================

-- Включаем расширение для UUID (если еще не включено)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Создание пользователя в auth.users
-- ============================================================================

-- Генерируем UUID для нового пользователя
DO $$
DECLARE
    admin_user_id UUID := uuid_generate_v4();
    admin_email VARCHAR(255) := 'konkev@bk.ru';
    admin_password VARCHAR(255) := 'Kk1478963';
    user_exists BOOLEAN;
BEGIN
    -- Проверяем, существует ли пользователь с таким email
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = admin_email
    ) INTO user_exists;

    -- Если пользователь уже существует, выводим сообщение и завершаем
    IF user_exists THEN
        RAISE NOTICE 'Пользователь с email % уже существует. Создание пропущено.', admin_email;
        RETURN;
    END IF;

    -- Вставляем пользователя в auth.users
    -- Используем ТОЛЬКО минимальный набор столбцов, которые точно существуют
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        (SELECT id FROM auth.instances LIMIT 1),
        'authenticated',
        'authenticated',
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        NOW(),
        '{"full_name": "Administrator", "role": "admin"}'::jsonb,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        NOW(),
        NOW()
    );

    -- Создаем запись в таблице profiles
    INSERT INTO public.profiles (
        auth_id,
        email,
        full_name,
        avatar_url,
        phone,
        date_of_birth,
        address,
        city,
        country,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        admin_email,
        'Administrator',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'Россия',
        NOW(),
        NOW()
    );

    -- Назначаем роль admin в таблице user_roles
    INSERT INTO public.user_roles (
        user_id,
        role,
        created_at
    ) VALUES (
        admin_user_id,
        'admin',
        NOW()
    );

    RAISE NOTICE 'Администратор успешно создан: %', admin_email;
END $$;

-- ============================================================================
-- Проверка создания пользователя
-- ============================================================================

-- Вывод информации о созданном пользователе
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.full_name,
    r.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.auth_id
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email = 'konkev@bk.ru';

-- ============================================================================
-- Примечания по использованию
-- ============================================================================
-- 1. После выполнения этой миграции пользователь будет создан в системе
-- 2. Email подтвержден автоматически (email_confirmed_at = NOW())
-- 3. Пароль захеширован с использованием bcrypt
-- 4. Пользователь имеет роль admin в таблице user_roles
-- 5. Для входа используйте:
--    - Email: konkev@bk.ru
--    - Пароль: Kk1478963
--
-- 6. Если пользователь уже существует, скрипт пропустит создание
--    и выведет соответствующее уведомление
--
-- 7. Для изменения пароля в будущем используйте:
--    UPDATE auth.users 
--    SET encrypted_password = crypt('новый_пароль', gen_salt('bf'))
--    WHERE email = 'konkev@bk.ru';
-- ============================================================================
