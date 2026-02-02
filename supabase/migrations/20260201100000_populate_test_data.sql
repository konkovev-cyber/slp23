
-- 1. Ensure we have a class
INSERT INTO "public"."school_classes" ("name") 
SELECT '9-А' 
WHERE NOT EXISTS (SELECT 1 FROM "public"."school_classes" WHERE "name" = '9-А');

-- 2. Ensure we have subjects
INSERT INTO "public"."subjects" ("name") VALUES 
('Математика'), 
('Русский язык'), 
('Литература'), 
('История'), 
('Физика'),
('Информатика')
ON CONFLICT ("name") DO NOTHING;

-- 3. Get IDs for usage
DO $$
DECLARE
    v_class_id bigint;
    v_math_id bigint;
    v_russ_id bigint;
    v_hist_id bigint;
    v_phys_id bigint;
    v_info_id bigint;
    v_teacher_id uuid;
    v_student_id uuid;
    v_assignment_math bigint;
    v_assignment_hist bigint;
    v_assignment_phys bigint;
BEGIN
    -- Get Class ID
    SELECT "id" INTO v_class_id FROM "public"."school_classes" WHERE "name" = '9-А' LIMIT 1;
    
    -- Get Subject IDs
    SELECT "id" INTO v_math_id FROM "public"."subjects" WHERE "name" = 'Математика' LIMIT 1;
    SELECT "id" INTO v_russ_id FROM "public"."subjects" WHERE "name" = 'Русский язык' LIMIT 1;
    SELECT "id" INTO v_hist_id FROM "public"."subjects" WHERE "name" = 'История' LIMIT 1;
    SELECT "id" INTO v_phys_id FROM "public"."subjects" WHERE "name" = 'Физика' LIMIT 1;
    SELECT "id" INTO v_info_id FROM "public"."subjects" WHERE "name" = 'Информатика' LIMIT 1;

    -- Get a Teacher (using the first user with 'teacher' role or just any user if none)
    -- Ideally, you should set a specific user as teacher. We will try to find one or fallback to current user.
    SELECT "auth_id" INTO v_teacher_id FROM "public"."profiles" WHERE "role" = 'teacher' LIMIT 1;
    IF v_teacher_id IS NULL THEN
        SELECT "auth_id" INTO v_teacher_id FROM "public"."profiles" ORDER BY "created_at" DESC LIMIT 1;
    END IF;

    -- Get a Student
    SELECT "auth_id" INTO v_student_id FROM "public"."profiles" WHERE "role" = 'student' LIMIT 1;
     IF v_student_id IS NULL THEN
        SELECT "auth_id" INTO v_student_id FROM "public"."profiles" ORDER BY "created_at" DESC LIMIT 1;
    END IF;

    -- Link Student to Class
    INSERT INTO "public"."students_info" ("student_id", "class_id")
    VALUES (v_student_id, v_class_id)
    ON CONFLICT ("student_id") DO UPDATE SET "class_id" = v_class_id;

    -- Create Teacher Assignments (linking Teacher + Class + Subject)
    INSERT INTO "public"."teacher_assignments" ("teacher_id", "class_id", "subject_id")
    VALUES 
    (v_teacher_id, v_class_id, v_math_id),
    (v_teacher_id, v_class_id, v_hist_id),
    (v_teacher_id, v_class_id, v_phys_id),
    (v_teacher_id, v_class_id, v_info_id)
    ON CONFLICT DO NOTHING;

    -- Get Assignment IDs
    SELECT "id" INTO v_assignment_math FROM "public"."teacher_assignments" WHERE "class_id" = v_class_id AND "subject_id" = v_math_id LIMIT 1;
    SELECT "id" INTO v_assignment_hist FROM "public"."teacher_assignments" WHERE "class_id" = v_class_id AND "subject_id" = v_hist_id LIMIT 1;
    SELECT "id" INTO v_assignment_phys FROM "public"."teacher_assignments" WHERE "class_id" = v_class_id AND "subject_id" = v_phys_id LIMIT 1;

    -- Create Schedule (Monday - Friday)
    -- Clear existing schedule for this class to be clean
    DELETE FROM "public"."schedule" WHERE "class_id" = v_class_id;

    -- Mon (1)
    INSERT INTO "public"."schedule" ("class_id", "day_of_week", "lesson_number", "subject_id", "teacher_id", "room") VALUES
    (v_class_id, 1, 1, v_math_id, v_teacher_id, '101'),
    (v_class_id, 1, 2, v_hist_id, v_teacher_id, '205'),
    (v_class_id, 1, 3, v_phys_id, v_teacher_id, '301');

    -- Tue (2)
    INSERT INTO "public"."schedule" ("class_id", "day_of_week", "lesson_number", "subject_id", "teacher_id", "room") VALUES
    (v_class_id, 2, 1, v_russ_id, v_teacher_id, '102'),
    (v_class_id, 2, 2, v_math_id, v_teacher_id, '101'),
    (v_class_id, 2, 3, v_info_id, v_teacher_id, 'Comp-1');

    -- Wed (3)
    INSERT INTO "public"."schedule" ("class_id", "day_of_week", "lesson_number", "subject_id", "teacher_id", "room") VALUES
    (v_class_id, 3, 1, v_phys_id, v_teacher_id, '301'),
    (v_class_id, 3, 2, v_hist_id, v_teacher_id, '205');

    -- Thu (4)
    INSERT INTO "public"."schedule" ("class_id", "day_of_week", "lesson_number", "subject_id", "teacher_id", "room") VALUES
    (v_class_id, 4, 1, v_math_id, v_teacher_id, '101'),
    (v_class_id, 4, 2, v_russ_id, v_teacher_id, '102');

    -- Fri (5)
    INSERT INTO "public"."schedule" ("class_id", "day_of_week", "lesson_number", "subject_id", "teacher_id", "room") VALUES
    (v_class_id, 5, 1, v_info_id, v_teacher_id, 'Comp-1'),
    (v_class_id, 5, 2, v_math_id, v_teacher_id, '101');

    -- Create Grades (Recent dates)
    INSERT INTO "public"."grades" ("student_id", "teacher_assignment_id", "grade", "date", "comment") VALUES
    (v_student_id, v_assignment_math, '5', CURRENT_DATE, 'Отличная работа на уроке'),
    (v_student_id, v_assignment_hist, '4', CURRENT_DATE - INTERVAL '1 day', 'Хороший ответ, но опоздал'),
    (v_student_id, v_assignment_phys, '3', CURRENT_DATE - INTERVAL '2 days', 'Плохо подготовился к лабе'),
    (v_student_id, v_assignment_math, '5', CURRENT_DATE - INTERVAL '3 days', 'Контрольная работа');

    -- Create Homework
    INSERT INTO "public"."homework" ("teacher_assignment_id", "title", "description", "due_date") VALUES
    (v_assignment_math, 'ДЗ №5', 'Стр. 45, упр. 1-5', CURRENT_DATE + INTERVAL '1 day'),
    (v_assignment_hist, 'Параграф 12', 'Читать и пересказывать', CURRENT_DATE + INTERVAL '1 day');

END $$;
