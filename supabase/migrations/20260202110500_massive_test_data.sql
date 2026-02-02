-- Create a huge set of test data for the school platform
-- Use this in Supabase SQL editor to populate your database

-- 1. Create Grades/Subjects if needed (simple check)
INSERT INTO subjects (name) VALUES 
('Математика'), ('Русский язык'), ('Литература'), ('История'), ('Биология'), ('География'), ('Физика'), ('Химия'), ('Английский язык'), ('Информатика')
ON CONFLICT DO NOTHING;

-- 2. Create Classes
INSERT INTO school_classes (name) VALUES 
('5А'), ('5Б'), ('6А'), ('7Б'), ('8А'), ('9А'), ('9Б'), ('10А'), ('11А')
ON CONFLICT DO NOTHING;

-- 3. Create Teachers (Fake Profiles)
-- We MUST insert into auth.users first to satisfy foreign key constraints.
DO $$
DECLARE
  i INTEGER;
  teacher_id UUID;
  fake_email TEXT;
BEGIN
  FOR i IN 1..10 LOOP
    teacher_id := gen_random_uuid();
    fake_email := 'teacher' || i || '_' || floor(random() * 1000) || '@example.com';
    
    -- Insert into auth.users (fake user)
    -- We try to use a minimal insert that usually works in Supabase
    BEGIN
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
      VALUES (
        teacher_id, 
        fake_email,
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMONPQRSTUVWXYZ', -- dummy hash
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        'authenticated',
        'authenticated'
      );
    EXCEPTION WHEN unique_violation THEN
      -- In case UUID collision or email collision (unlikely with random), just skip
      CONTINUE;
    END;
    
    -- Insert Profile
    INSERT INTO profiles (auth_id, full_name, avatar_url)
    VALUES (
      teacher_id, 
      'Учитель ' || i, 
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher' || i
    ) ON CONFLICT DO NOTHING;
    
    -- Insert Role
    INSERT INTO user_roles (user_id, role)
    VALUES (teacher_id, 'teacher')
    ON CONFLICT DO NOTHING;
    
    -- Assign subject assignments randomly
    INSERT INTO teacher_assignments (teacher_id, class_id, subject_id)
    SELECT 
      teacher_id, 
      sc.id, 
      s.id 
    FROM school_classes sc, subjects s
    WHERE sc.name IN ('5А', '9А', '11А') AND s.id = (i % 10) + 1
    ON CONFLICT DO NOTHING;
    
  END LOOP;
END $$;

-- 4. Create Students and Link to Classes
DO $$
DECLARE
  i INTEGER;
  student_id UUID;
  class_5a_id INT;
  class_9a_id INT;
  fake_email TEXT;
BEGIN
  SELECT id INTO class_5a_id FROM school_classes WHERE name = '5А';
  SELECT id INTO class_9a_id FROM school_classes WHERE name = '9А';

  -- Create 20 students for 5A
  FOR i IN 1..20 LOOP
    student_id := gen_random_uuid();
    fake_email := 'student5a_' || i || '_' || floor(random() * 1000) || '@example.com';
    
    BEGIN
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
      VALUES (
        student_id, 
        fake_email,
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMONPQRSTUVWXYZ',
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        'authenticated',
        'authenticated'
      );
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
    
    -- Insert Profile
    INSERT INTO profiles (auth_id, full_name, avatar_url)
    VALUES (
      student_id, 
      'Ученик 5А-' || i, 
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Student5A' || i
    ) ON CONFLICT DO NOTHING;

    -- Insert Role
    INSERT INTO user_roles (user_id, role)
    VALUES (student_id, 'student')
    ON CONFLICT DO NOTHING;

    -- Link to Class
    INSERT INTO students_info (student_id, class_id)
    VALUES (student_id, class_5a_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Create 15 students for 9A
  FOR i IN 1..15 LOOP
    student_id := gen_random_uuid();
    fake_email := 'student9a_' || i || '_' || floor(random() * 1000) || '@example.com';
    
    BEGIN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
        VALUES (
          student_id, 
          fake_email,
          '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMONPQRSTUVWXYZ',
          now(),
          '{"provider": "email", "providers": ["email"]}',
          '{}',
          'authenticated',
          'authenticated'
        );
     EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
    
    -- Insert Profile
    INSERT INTO profiles (auth_id, full_name, avatar_url)
    VALUES (
      student_id, 
      'Ученик 9А-' || i, 
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Student9A' || i
    ) ON CONFLICT DO NOTHING;

    -- Insert Role
    INSERT INTO user_roles (user_id, role)
    VALUES (student_id, 'student')
    ON CONFLICT DO NOTHING;

    -- Link to Class
    INSERT INTO students_info (student_id, class_id)
    VALUES (student_id, class_9a_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 5. Create Schedule (Randomized)
-- We need to find assignments to link schedule
INSERT INTO schedule (class_id, day_of_week, lesson_number, subject_id, teacher_id)
SELECT 
  ta.class_id, 
  day_num, 
  lesson_num, 
  ta.subject_id, 
  ta.teacher_id
FROM teacher_assignments ta
CROSS JOIN generate_series(1, 5) AS day_num -- Mon-Fri
CROSS JOIN generate_series(1, 6) AS lesson_num -- 6 lessons
WHERE ta.id % 7 = (day_num + lesson_num) % 7 -- simple randomization
ON CONFLICT DO NOTHING;

-- 6. Add Grades (Randomly for the last 30 days)
DO $$
DECLARE
  assignment_rec RECORD;
  student_rec RECORD;
  day_offset INTEGER;
BEGIN
  FOR assignment_rec IN SELECT * FROM teacher_assignments LOOP
    -- Get students for this class
    FOR student_rec IN SELECT student_id FROM students_info WHERE class_id = assignment_rec.class_id LOOP
      -- Insert random grades for past 10 days
      FOR day_offset IN 0..10 LOOP
        IF (random() > 0.7) THEN -- 30% chance of grade
           INSERT INTO grades (student_id, teacher_assignment_id, grade, date, comment)
           VALUES (
             student_rec.student_id,
             assignment_rec.id,
             (floor(random() * 4) + 2)::text, -- 2 to 5
             (CURRENT_DATE - day_offset),
             CASE WHEN random() > 0.8 THEN 'Хорошая работа' ELSE NULL END
           );
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
