-- ============================================================================
-- Миграция: Включение RLS и настройка политик безопасности
-- Дата: 2026-04-09
-- Описание: Устранение уязвимости "Table publicly accessible"
-- ============================================================================

BEGIN;

-- 1. Удаляем слишком широкие права, выданные ранее
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 2. Включаем RLS для всех таблиц

-- Безопасные гранты для анонимов (только если таблицы существуют)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_content') THEN
        GRANT SELECT ON public.site_content TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
        GRANT SELECT ON public.site_settings TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'navigation_items') THEN
        GRANT SELECT ON public.navigation_items TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        GRANT SELECT ON public.posts TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_media') THEN
        GRANT SELECT ON public.post_media TO anon;
    END IF;
END $$;

-- 2. Включаем RLS для всех существующих таблиц проекта
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homework_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homework_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parents_children ENABLE ROW LEVEL SECURITY;

-- Также убеждаемся, что для таблиц дневника RLS включен (они создавались в других миграциях)
ALTER TABLE IF EXISTS public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diary_parent_feedback ENABLE ROW LEVEL SECURITY;

-- 3. Настройка политик для ПУБЛИЧНЫХ данных (доступны без входа)
DO $$ 
BEGIN 
    -- Новости
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        DROP POLICY IF EXISTS "Public select posts" ON public.posts;
        CREATE POLICY "Public select posts" ON public.posts FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_media') THEN
        DROP POLICY IF EXISTS "Public select post_media" ON public.post_media;
        CREATE POLICY "Public select post_media" ON public.post_media FOR SELECT USING (true);
    END IF;

    -- Контент сайта
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_content') THEN
        DROP POLICY IF EXISTS "Public select site_content" ON public.site_content;
        CREATE POLICY "Public select site_content" ON public.site_content FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
        DROP POLICY IF EXISTS "Public select site_settings" ON public.site_settings;
        CREATE POLICY "Public select site_settings" ON public.site_settings FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'navigation_items') THEN
        DROP POLICY IF EXISTS "Public select navigation_items" ON public.navigation_items;
        CREATE POLICY "Public select navigation_items" ON public.navigation_items FOR SELECT USING (true);
    END IF;
END $$;

-- 4. Настройка политик для ПРОФИЛЕЙ и РОЛЕЙ

-- Профили: все вошедшие видят всех (для списков), но меняют только себя или админ
DROP POLICY IF EXISTS "Authenticated select profiles" ON public.profiles;
CREATE POLICY "Authenticated select profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Owner or admin update profiles" ON public.profiles;
CREATE POLICY "Owner or admin update profiles" ON public.profiles 
FOR UPDATE TO authenticated 
USING (auth.uid() = auth_id OR public.is_admin(auth.uid()));

-- Роли: каждый видит свои, админ видит все
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 5. Настройка политик для ШКОЛЬНЫХ данных

-- Классы и предметы: все вошедшие видят
DROP POLICY IF EXISTS "Authenticated select classes" ON public.school_classes;
CREATE POLICY "Authenticated select classes" ON public.school_classes FOR SELECT TO authenticated USING (true);

-- Предметы
DROP POLICY IF EXISTS "Authenticated select subjects" ON public.subjects;
CREATE POLICY "Authenticated select subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

-- Расписание: все вошедшие видят
DROP POLICY IF EXISTS "Authenticated select schedule" ON public.schedule;
CREATE POLICY "Authenticated select schedule" ON public.schedule FOR SELECT TO authenticated USING (true);

-- Оценки: только ученик, его родители, учитель или админ
DROP POLICY IF EXISTS "Grades access policy" ON public.grades;
CREATE POLICY "Grades access policy" ON public.grades FOR SELECT TO authenticated 
USING (
    student_id = auth.uid() 
    OR public.is_admin(auth.uid())
    OR public.is_teacher(auth.uid())
    OR EXISTS (SELECT 1 FROM public.parents_children WHERE parent_id = auth.uid() AND child_id = grades.student_id)
);

-- Домашнее задание: все вошедшие видят (обычно не секретно внутри школы)
DROP POLICY IF EXISTS "Authenticated select homework" ON public.homework;
CREATE POLICY "Authenticated select homework" ON public.homework FOR SELECT TO authenticated USING (true);

-- 6. Права администратора на ВСЁ (ALL)
-- Для простоты добавим по одной политике на таблицу для админа, если планируется управление через UI
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))', t);
    END LOOP;
END $$;

COMMIT;
