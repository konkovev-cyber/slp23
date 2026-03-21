-- ============================================================================
-- Скрипт: Очистка тестовых данных дневника (Diary/School)
-- Описание: Удаляет все записи из таблиц дневника, оценок, ДЗ и расписания.
--           Также удаляет тестовые профили пользователей (@example.com).
-- ============================================================================

-- 1. Очистка таблиц системы "Дневник" (Diary)
TRUNCATE TABLE public.diary_attachments CASCADE;
TRUNCATE TABLE public.diary_comments CASCADE;
TRUNCATE TABLE public.diary_entry_tags CASCADE;
TRUNCATE TABLE public.diary_notifications CASCADE;
TRUNCATE TABLE public.diary_parent_feedback CASCADE;
TRUNCATE TABLE public.diary_visibility CASCADE;
TRUNCATE TABLE public.diary_entries CASCADE;

-- 2. Очистка таблиц системы "Школа" (School)
-- Проверяем существование таблиц перед удалением
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grades') THEN
        TRUNCATE TABLE public.grades CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'homework') THEN
        TRUNCATE TABLE public.homework CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedule') THEN
        TRUNCATE TABLE public.schedule CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_assignments') THEN
        TRUNCATE TABLE public.teacher_assignments CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students_info') THEN
        TRUNCATE TABLE public.students_info CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_enrollment') THEN
        TRUNCATE TABLE public.student_enrollment CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timetable') THEN
        TRUNCATE TABLE public.timetable CASCADE;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'journal_grades') THEN
        TRUNCATE TABLE public.journal_grades CASCADE;
    END IF;
END $$;

-- 3. Удаление тестовых пользователей
-- Мы удаляем только тех, у кого email заканчивается на @example.com 
DO $$
BEGIN
    -- Удаляем роли
    DELETE FROM public.user_roles 
    WHERE user_id IN (SELECT auth_id FROM public.profiles WHERE email LIKE '%@example.com');

    -- Удаляем связи родителей и детей
    DELETE FROM public.parents_children
    WHERE parent_id IN (SELECT auth_id FROM public.profiles WHERE email LIKE '%@example.com')
       OR child_id IN (SELECT auth_id FROM public.profiles WHERE email LIKE '%@example.com');

    -- Удаляем профили
    DELETE FROM public.profiles 
    WHERE email LIKE '%@example.com';
    
    -- Примечание: Пользователи в auth.users останутся, их нужно удалять через Dashboard.
END $$;

-- 4. Предметы и классы оставляем нетронутыми, так как это структура
-- Если нужно удалить и их, раскомментируйте строки ниже:
-- TRUNCATE TABLE public.subjects CASCADE;
-- TRUNCATE TABLE public.school_classes CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ Тестовые данные дневника успешно удалены!';
END $$;

