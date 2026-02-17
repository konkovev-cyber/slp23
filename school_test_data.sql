-- Тестовые данные для школьного дневника
-- Запускать ПОСЛЕ school_diary_schema.sql

-- 1. Создаем предметы
INSERT INTO public.subjects (name) VALUES
    ('Математика'),
    ('Русский язык'),
    ('Литература'),
    ('Английский язык'),
    ('История'),
    ('Обществознание'),
    ('География'),
    ('Биология'),
    ('Физика'),
    ('Химия'),
    ('Информатика'),
    ('Физическая культура'),
    ('ОБЖ'),
    ('Музыка'),
    ('ИЗО')
ON CONFLICT (name) DO NOTHING;

-- 2. Создаем классы
INSERT INTO public.school_classes (name) VALUES
    ('10А'),
    ('10Б'),
    ('11А'),
    ('11Б'),
    ('9А'),
    ('9Б')
ON CONFLICT DO NOTHING;

-- 3. Функция для быстрого добавления тестового расписания
CREATE OR REPLACE FUNCTION add_test_schedule(
    p_class_name TEXT,
    p_teacher_id UUID,
    p_subject_name TEXT,
    p_day INT,
    p_lesson INT,
    p_time TIME
) RETURNS VOID AS $$
DECLARE
    v_class_id UUID;
    v_subject_id UUID;
    v_assignment_id UUID;
BEGIN
    -- Получаем ID класса
    SELECT id INTO v_class_id FROM public.school_classes WHERE name = p_class_name;
    
    -- Получаем ID предмета
    SELECT id INTO v_subject_id FROM public.subjects WHERE name = p_subject_name;
    
    -- Создаем назначение учителя (если еще нет)
    INSERT INTO public.teacher_assignments (teacher_id, subject_id)
    VALUES (p_teacher_id, v_subject_id)
    ON CONFLICT (teacher_id, subject_id) DO NOTHING
    RETURNING id INTO v_assignment_id;
    
    -- Если назначение уже было, получаем его ID
    IF v_assignment_id IS NULL THEN
        SELECT id INTO v_assignment_id 
        FROM public.teacher_assignments 
        WHERE teacher_id = p_teacher_id AND subject_id = v_subject_id;
    END IF;
    
    -- Добавляем урок в расписание
    INSERT INTO public.schedule (class_id, subject_id, teacher_id, day_of_week, lesson_number, start_time)
    VALUES (v_class_id, v_subject_id, p_teacher_id, p_day, p_lesson, p_time)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Добавлен урок: % - % (урок №%, %)', p_class_name, p_subject_name, p_lesson, p_time;
END;
$$ LANGUAGE plpgsql;

-- 4. Функция для добавления тестовой оценки
CREATE OR REPLACE FUNCTION add_test_grade(
    p_student_id UUID,
    p_teacher_id UUID,
    p_subject_name TEXT,
    p_grade TEXT,
    p_comment TEXT DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
    v_subject_id UUID;
    v_assignment_id UUID;
BEGIN
    -- Получаем ID предмета
    SELECT id INTO v_subject_id FROM public.subjects WHERE name = p_subject_name;
    
    -- Получаем или создаем назначение учителя
    SELECT id INTO v_assignment_id 
    FROM public.teacher_assignments 
    WHERE teacher_id = p_teacher_id AND subject_id = v_subject_id;
    
    IF v_assignment_id IS NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, subject_id)
        VALUES (p_teacher_id, v_subject_id)
        RETURNING id INTO v_assignment_id;
    END IF;
    
    -- Добавляем оценку
    INSERT INTO public.grades (student_id, assignment_id, grade, comment, date)
    VALUES (p_student_id, v_assignment_id, p_grade, p_comment, p_date);
    
    RAISE NOTICE 'Добавлена оценка % по предмету % для ученика %', p_grade, p_subject_name, p_student_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Функция для добавления домашнего задания
CREATE OR REPLACE FUNCTION add_test_homework(
    p_teacher_id UUID,
    p_subject_name TEXT,
    p_title TEXT,
    p_description TEXT,
    p_due_date DATE
) RETURNS VOID AS $$
DECLARE
    v_subject_id UUID;
    v_assignment_id UUID;
BEGIN
    SELECT id INTO v_subject_id FROM public.subjects WHERE name = p_subject_name;
    
    SELECT id INTO v_assignment_id 
    FROM public.teacher_assignments 
    WHERE teacher_id = p_teacher_id AND subject_id = v_subject_id;
    
    IF v_assignment_id IS NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, subject_id)
        VALUES (p_teacher_id, v_subject_id)
        RETURNING id INTO v_assignment_id;
    END IF;
    
    INSERT INTO public.homework (assignment_id, title, description, due_date)
    VALUES (v_assignment_id, p_title, p_description, p_due_date);
    
    RAISE NOTICE 'Добавлено ДЗ: % (срок: %)', p_title, p_due_date;
END;
$$ LANGUAGE plpgsql;

-- 6. Функция для привязки ученика к классу
CREATE OR REPLACE FUNCTION add_student_to_class(
    p_student_id UUID,
    p_class_name TEXT
) RETURNS VOID AS $$
DECLARE
    v_class_id UUID;
BEGIN
    SELECT id INTO v_class_id FROM public.school_classes WHERE name = p_class_name;
    
    INSERT INTO public.students_info (student_id, class_id)
    VALUES (p_student_id, v_class_id)
    ON CONFLICT (student_id) DO UPDATE SET class_id = v_class_id;
    
    RAISE NOTICE 'Ученик % добавлен в класс %', p_student_id, p_class_name;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    RAISE NOTICE '✅ Тестовые данные загружены!';
    RAISE NOTICE '📚 Создано предметов: 15';
    RAISE NOTICE '🏫 Создано классов: 6';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Доступные функции:';
    RAISE NOTICE '  • add_student_to_class(student_id, class_name)';
    RAISE NOTICE '  • add_test_schedule(class_name, teacher_id, subject_name, day, lesson, time)';
    RAISE NOTICE '  • add_test_grade(student_id, teacher_id, subject_name, grade, comment, date)';
    RAISE NOTICE '  • add_test_homework(teacher_id, subject_name, title, description, due_date)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Примеры использования:';
    RAISE NOTICE '  SELECT add_student_to_class(''UUID_УЧЕНИКА'', ''10А'');';
    RAISE NOTICE '  SELECT add_test_schedule(''10А'', ''UUID_УЧИТЕЛЯ'', ''Математика'', 0, 1, ''08:00'');';
    RAISE NOTICE '  SELECT add_test_grade(''UUID_УЧЕНИКА'', ''UUID_УЧИТЕЛЯ'', ''Математика'', ''5'', ''Отлично!'', CURRENT_DATE);';
    RAISE NOTICE '';
    RAISE NOTICE '💡 day_of_week: 0=Понедельник, 1=Вторник, ..., 6=Воскресенье';
END $$;
