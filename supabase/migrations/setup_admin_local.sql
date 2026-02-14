-- ============================================================================
-- Миграция: Настройка пользователя admin@admin.local
-- Версия: 1.0.0
-- Дата: 2026-02-10
-- Описание: Создание записей в profiles и user_roles для уже существующего пользователя
-- ============================================================================

-- ============================================================================
-- ВАЖНОЕ ПРИМЕЧАНИЕ
-- ============================================================================
-- Этот скрипт предназначен для пользователя, который УЖЕ создан в Supabase
-- через Dashboard или CLI с email: admin@admin.local
--
-- Скрипт выполняет следующие действия:
-- 1. Получает ID пользователя из auth.users по email
-- 2. Создает запись в таблице profiles (если не существует)
-- 3. Назначает роль admin в таблице user_roles (если не назначена)
-- ============================================================================

-- ============================================================================
-- Шаг 1: Настройка пользователя admin@admin.local
-- ============================================================================

DO $$
DECLARE
    admin_user_id UUID;
    admin_email VARCHAR(255) := 'admin@admin.local';
    profile_exists BOOLEAN;
    role_exists BOOLEAN;
BEGIN
    -- Получаем ID пользователя из auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    -- Проверяем, найден ли пользователь
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Пользователь с email % не найден в auth.users. 
        Пожалуйста, сначала создайте пользователя в Supabase Dashboard:
        1. Откройте https://supabase.com/dashboard
        2. Выберите ваш проект
        3. Перейдите в Authentication > Users
        4. Нажмите "Add user" или "New user"
        5. Введите email: admin@admin.local
        6. Установите пароль
        7. Отметьте "Auto Confirm User"
        8. Нажмите "Create user"
        9. После создания выполните этот скрипт снова', admin_email;
    END IF;

    RAISE NOTICE 'Найден пользователь: % (ID: %)', admin_email, admin_user_id;

    -- Проверяем, существует ли запись в profiles
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE auth_id = admin_user_id
    ) INTO profile_exists;

    IF NOT profile_exists THEN
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

        RAISE NOTICE 'Запись в profiles создана для пользователя: %', admin_email;
    ELSE
        RAISE NOTICE 'Запись в profiles уже существует для пользователя: %', admin_email;
    END IF;

    -- Проверяем, существует ли роль admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin'
    ) INTO role_exists;

    IF NOT role_exists THEN
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

        RAISE NOTICE 'Роль admin назначена пользователю: %', admin_email;
    ELSE
        RAISE NOTICE 'Роль admin уже назначена пользователю: %', admin_email;
    END IF;

    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Администратор успешно настроен!';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'User ID: %', admin_user_id;
    RAISE NOTICE '=================================================';
END $$;

-- ============================================================================
-- Шаг 2: Проверка результата
-- ============================================================================

-- Вывод информации о настроенном пользователе
SELECT 
    u.id AS user_id,
    u.email,
    u.email_confirmed_at,
    u.created_at AS auth_created_at,
    u.updated_at AS auth_updated_at,
    p.full_name,
    p.avatar_url,
    p.phone,
    p.city,
    p.country,
    r.role,
    r.created_at AS role_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.auth_id
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email = 'admin@admin.local';

-- ============================================================================
-- ИНСТРУКЦИИ ПО ВЫПОЛНЕНИЮ
-- ============================================================================
--
-- ПРЕДВАРИТЕЛЬНЫЕ ТРЕБОВАНИЯ:
-- 1. Пользователь admin@admin.local должен быть создан в Supabase Dashboard
--    или через Supabase CLI
--
-- СПОСОБ 1: Выполнение через Supabase Dashboard (Рекомендуется)
-- ----------------------------------------------------------------
-- 1. Откройте https://supabase.com/dashboard
-- 2. Выберите ваш проект
-- 3. Перейдите в SQL Editor
-- 4. Создайте новый запрос
-- 5. Вставьте этот скрипт
-- 6. Нажмите "Run" для выполнения
-- 7. Проверьте результат в секции "Results"
--
-- СПОСОБ 2: Выполнение через Supabase CLI
-- ----------------------------------------------------------------
-- 1. Убедитесь, что Supabase CLI установлен:
--    supabase --version
--
-- 2. Войдите в Supabase (если еще не вошли):
--    supabase login
--
-- 3. Подключитесь к вашему проекту:
--    supabase link --project-ref <ваш-project-ref>
--
-- 4. Выполните скрипт:
--    supabase db execute --file supabase/migrations/setup_admin_local.sql
--
-- СПОСОБ 3: Выполнение через psql (если есть доступ)
-- ----------------------------------------------------------------
-- 1. Получите строку подключения из Supabase Dashboard:
--    - Settings > Database > Connection string
--    - Выберите "URI" или "Transaction mode"
--
-- 2. Выполните:
--    psql <connection-string> -f supabase/migrations/setup_admin_local.sql
--
-- ============================================================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================================================
--
-- После выполнения скрипта проверьте:
--
-- 1. В Supabase Dashboard:
--    - Authentication > Users - пользователь admin@admin.local должен отображаться
--    - Table Editor > profiles - должна быть запись с этим email
--    - Table Editor > user_roles - должна быть запись с role = 'admin'
--
-- 2. Проверьте вход в систему:
--    - Email: admin@admin.local
--    - Пароль: (тот, который вы установили при создании пользователя)
--
-- ============================================================================
-- УСТРАНЕНИЕ НЕПОЛАДОК
-- ============================================================================
--
-- Ошибка: "Пользователь с email admin@admin.local не найден"
-- Решение: Сначала создайте пользователя в Supabase Dashboard:
--          Authentication > Users > Add user
--
-- Ошибка: "relation public.profiles does not exist"
-- Решение: Убедитесь, что таблицы созданы. Выполните миграцию create_diary_tables.sql
--
-- Ошибка: "relation public.user_roles does not exist"
-- Решение: Убедитесь, что таблицы созданы. Выполните миграцию create_diary_tables.sql
--
-- ============================================================================
-- ПОЛЕЗНЫЕ SQL ЗАПРОСЫ ДЛЯ ПРОВЕРКИ
-- ============================================================================
--
-- Проверить всех пользователей с ролями:
-- SELECT u.email, p.full_name, r.role
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.auth_id
-- LEFT JOIN public.user_roles r ON u.id = r.user_id
-- ORDER BY u.created_at DESC;
--
-- Проверить только администраторов:
-- SELECT u.email, p.full_name, u.created_at
-- FROM auth.users u
-- INNER JOIN public.user_roles r ON u.id = r.user_id
-- LEFT JOIN public.profiles p ON u.id = p.auth_id
-- WHERE r.role = 'admin';
--
-- ============================================================================
