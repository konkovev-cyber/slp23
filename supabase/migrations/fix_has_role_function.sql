-- ============================================================================
-- Миграция: Исправление функции has_role и таблицы user_roles
-- Версия: 1.0.0
-- Дата: 2026-02-10
-- Описание: Создание функции has_role и настройка RLS политик
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
-- Шаг 2: Создание или обновление таблицы user_roles
-- ============================================================================

-- Проверяем, существует ли таблица
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
    -- Создаем таблицу, если она не существует
    CREATE TABLE public.user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role public.app_role NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, role)
    );
    RAISE NOTICE 'Таблица user_roles создана';
  ELSE
    -- Проверяем структуру существующей таблицы
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_roles' AND table_schema = 'public'
      AND column_name = 'role' AND data_type = 'character varying'
    ) THEN
      -- Таблица использует VARCHAR вместо app_role, нужно пересоздать
      RAISE NOTICE 'Таблица user_roles использует VARCHAR, требуется миграция данных';
      
      -- Создаем временную таблицу для сохранения данных
      CREATE TEMP TABLE user_roles_backup AS SELECT * FROM public.user_roles;
      
      -- Удаляем старую таблицу
      DROP TABLE public.user_roles;
      
      -- Создаем новую таблицу с правильным типом
      CREATE TABLE public.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role public.app_role NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (user_id, role)
      );
      
      -- Восстанавливаем данные
      INSERT INTO public.user_roles (user_id, role, created_at)
      SELECT user_id, role::public.app_role, created_at
      FROM user_roles_backup;
      
      RAISE NOTICE 'Данные user_roles восстановлены';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Шаг 3: Включение RLS
-- ============================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Шаг 4: Создание функции has_role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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
      AND role = _role
  )
$$;

-- ============================================================================
-- Шаг 5: Создание вспомогательных функций
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'::public.app_role);
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_teacher(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'teacher'::public.app_role);
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_student(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'student'::public.app_role);
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_parent(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'parent'::public.app_role);
$$ LANGUAGE sql;

-- ============================================================================
-- Шаг 6: Настройка RLS политик
-- ============================================================================

-- Удаляем существующие политики, если они есть
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view user roles" ON public.user_roles;

-- Создаем новые политики
DO $$ BEGIN
  CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Шаг 7: Проверка результата
-- ============================================================================

-- Проверяем функцию has_role
SELECT 
  'has_role function' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace) 
    THEN 'EXISTS' 
    ELSE 'NOT FOUND' 
  END as status;

-- Проверяем таблицу user_roles
SELECT 
  'user_roles table' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') 
    THEN 'EXISTS' 
    ELSE 'NOT FOUND' 
  END as status;

-- Проверяем тип app_role
SELECT 
  'app_role type' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) 
    THEN 'EXISTS' 
    ELSE 'NOT FOUND' 
  END as status;

-- Проверяем роль admin@admin.local
SELECT 
  u.email,
  r.role,
  r.created_at as role_created_at
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email = 'admin@admin.local';

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
--    supabase db execute --file supabase/migrations/fix_has_role_function.sql
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
