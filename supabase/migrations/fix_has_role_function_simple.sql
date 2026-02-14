-- ============================================================================
-- Миграция: Создание функции has_role (упрощенная версия)
-- Версия: 1.0.0
-- Дата: 2026-02-10
-- Описание: Создание функции has_role для проверки ролей пользователей
-- ============================================================================

-- ============================================================================
-- Шаг 1: Создание или обновление типа app_role
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'teacher', 'student', 'parent');
EXCEPTION
  WHEN duplicate_object THEN
    -- Тип уже существует, добавляем недостающие значения
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============================================================================
-- Шаг 2: Создание функции has_role (версия для text)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role::text
  )
$$;

-- ============================================================================
-- Шаг 3: Создание вспомогательных функций
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_teacher(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'teacher');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_student(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'student');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_parent(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'parent');
$$ LANGUAGE sql;

-- ============================================================================
-- Шаг 4: Проверка результата
-- ============================================================================

-- Проверяем функцию has_role
SELECT 
  'has_role function' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace) 
    THEN 'EXISTS' 
    ELSE 'NOT FOUND' 
  END as status;

-- Проверяем тип столбца role
SELECT 
  'role column type' as check_item,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'user_roles' AND table_schema = 'public' AND column_name = 'role';

-- Проверяем роль admin@admin.local
SELECT 
  u.email,
  r.role,
  r.created_at as role_created_at
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email = 'admin@admin.local';

-- Тестовый вызов функции has_role
DO $$
DECLARE
  admin_user_id UUID;
  has_admin_role BOOLEAN;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.local'
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    SELECT public.has_role(admin_user_id, 'admin') INTO has_admin_role;
    RAISE NOTICE 'Тест has_role для admin@admin.local: %', has_admin_role;
  END IF;
END $$;

-- ============================================================================
-- ИНСТРУКЦИИ ПО ВЫПОЛНЕНИЮ
-- ============================================================================
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
--    supabase db execute --file supabase/migrations/fix_has_role_function_simple.sql
--
-- ============================================================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================================================
--
-- После выполнения скрипта проверьте:
--
-- 1. В Supabase Dashboard:
--    - Database > Functions - функция has_role должна отображаться
--    - Table Editor > user_roles - должна быть запись с role = 'admin'
--
-- 2. Проверьте вход в систему:
--    - Email: admin@admin.local
--    - Пароль: (тот, который вы установили при создании пользователя)
--
-- 3. Проверьте консоль браузера:
--    - Должно быть: [useIsAdmin] RPC result: { data: true, error: null }
--
-- ============================================================================
