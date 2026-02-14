-- ============================================================================
-- Миграция: Создание пользователя-админа правильным способом
-- Версия: 1.0.0
-- Дата: 2026-02-10
-- Описание: Создание пользователя с ролью admin через Supabase Management API
-- ============================================================================

-- ============================================================================
-- ВАЖНОЕ ПРИМЕЧАНИЕ
-- ============================================================================
-- Supabase не поддерживает прямую вставку в auth.users через SQL для создания
-- новых пользователей с рабочей аутентификацией. Правильный способ создания
-- пользователя - через Supabase Management API или Supabase CLI.
--
-- Этот скрипт создает структуру для пользователя, но для полной функциональности
-- необходимо выполнить команды Supabase CLI, указанные ниже.
-- ============================================================================

-- ============================================================================
-- Шаг 1: Создание пользователя через Supabase Management API
-- ============================================================================
-- ВЫПОЛНИТЕ ЭТУ КОМАНДУ В ТЕРМИНАЛЕ (НЕ В SQL):
--
-- supabase auth admin create-user \
--   --email konkev@bk.ru \
--   --password Kk1478963 \
--   --email-confirm \
--   --data '{"full_name": "Administrator", "role": "admin"}'
--
-- Эта команда создаст пользователя в auth.users с правильным хешем пароля.
-- После выполнения команды запомните возвращенный UUID пользователя.
-- ============================================================================

-- ============================================================================
-- Шаг 2: Создание записей в public.profiles и public.user_roles
-- ============================================================================

-- Получаем ID созданного пользователя (замените UUID на тот, что вернула команда выше)
-- Если вы еще не создали пользователя через CLI, сначала выполните команду выше.

DO $$
DECLARE
    admin_user_id UUID;
    admin_email VARCHAR(255) := 'konkev@bk.ru';
    user_exists BOOLEAN;
BEGIN
    -- Проверяем, существует ли пользователь в auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Пользователь с email % не найден в auth.users. Сначала создайте пользователя через Supabase CLI командой:
supabase auth admin create-user --email konkev@bk.ru --password Kk1478963 --email-confirm --data ''{"full_name": "Administrator", "role": "admin"}''', admin_email;
    END IF;

    -- Проверяем, существует ли запись в profiles
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE auth_id = admin_user_id
    ) INTO user_exists;

    IF NOT user_exists THEN
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
    ) INTO user_exists;

    IF NOT user_exists THEN
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

    RAISE NOTICE 'Администратор успешно настроен: % (ID: %)', admin_email, admin_user_id;
END $$;

-- ============================================================================
-- Шаг 3: Проверка создания пользователя
-- ============================================================================

-- Вывод информации о созданном пользователе
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at,
    p.full_name,
    r.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.auth_id
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email = 'konkev@bk.ru';

-- ============================================================================
-- Полные инструкции по выполнению
-- ============================================================================
--
-- ПОРЯДОК ВЫПОЛНЕНИЯ:
--
-- 1. Установите Supabase CLI (если еще не установлен):
--    npm install -g supabase
--
-- 2. Войдите в Supabase (если еще не вошли):
--    supabase login
--
-- 3. Подключитесь к вашему проекту:
--    supabase link --project-ref <ваш-project-ref>
--
-- 4. Создайте пользователя через Supabase CLI:
--    supabase auth admin create-user \
--      --email konkev@bk.ru \
--      --password Kk1478963 \
--      --email-confirm \
--      --data '{"full_name": "Administrator", "role": "admin"}'
--
--    Эта команда вернет UUID созданного пользователя.
--
-- 5. Выполните этот SQL скрипт в Supabase Dashboard:
--    - Откройте https://supabase.com/dashboard
--    - Выберите ваш проект
--    - Перейдите в SQL Editor
--    - Вставьте и выполните этот скрипт
--
-- 6. Проверьте результат:
--    - В Supabase Dashboard перейдите в Authentication > Users
--    - Убедитесь, что пользователь konkev@bk.ru отображается в списке
--
-- 7. Проверьте вход в систему:
--    - Email: konkev@bk.ru
--    - Пароль: Kk1478963
--
-- АЛЬТЕРНАТИВНЫЙ СПОСОБ (через Supabase Dashboard):
--
-- 1. Откройте https://supabase.com/dashboard
-- 2. Выберите ваш проект
-- 3. Перейдите в Authentication > Users
-- 4. Нажмите кнопку "Add user" или "New user"
-- 5. Введите email: konkev@bk.ru
-- 6. Установите пароль: Kk1478963
-- 7. Отметьте "Auto Confirm User"
-- 8. Нажмите "Create user"
-- 9. После создания пользователя выполните этот SQL скрипт
--    для создания записей в profiles и user_roles
--
-- ============================================================================
-- ============================================================================
-- Дополнительные полезные команды Supabase CLI
-- ============================================================================
--
-- Обновление пароля пользователя:
-- supabase auth admin update-user <user-id> --password Kk1478963
--
-- Удаление пользователя:
-- supabase auth admin delete-user <user-id>
--
-- Список всех пользователей:
-- supabase auth admin list-users
--
-- Получение информации о пользователе:
-- supabase auth admin get-user <user-id>
--
-- ============================================================================
