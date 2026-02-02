-- FIX PERMISSIONS AND RLS
-- This script ensures that all tables are readable by authenticated users (and anon for dev/testing)
-- It disables Row Level Security (RLS) for the school tables to prevent access issues during testing.

BEGIN;

-- 1. Grant basic permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 2. Disable RLS for School Tables (To ensure data is visible)
ALTER TABLE students_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE homework DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Just in case RLS is mistakenly re-enabled or required by some setup, add permissive policies
DROP POLICY IF EXISTS "Public read" ON students_info;
CREATE POLICY "Public read" ON students_info FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read" ON school_classes;
CREATE POLICY "Public read" ON school_classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read" ON schedule;
CREATE POLICY "Public read" ON schedule FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read" ON grades;
CREATE POLICY "Public read" ON grades FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read" ON teacher_assignments;
CREATE POLICY "Public read" ON teacher_assignments FOR SELECT USING (true);

-- 4. Fix potential missing link in students_info (Data Repair)
-- If for some reason students are missing class info, let's try to link them to 9-A (default)
DO $$
DECLARE
  class_id_9a INT;
BEGIN
  SELECT id INTO class_id_9a FROM school_classes WHERE name = '9А' LIMIT 1;
  
  -- If 9A doesn't exist, create it
  IF class_id_9a IS NULL THEN
    INSERT INTO school_classes (name) VALUES ('9А') RETURNING id INTO class_id_9a;
  END IF;

  -- Insert missing students_info for any student profile that doesn't have it
  INSERT INTO students_info (student_id, class_id)
  SELECT p.auth_id, class_id_9a
  FROM profiles p
  LEFT JOIN students_info si ON p.auth_id = si.student_id
  WHERE si.student_id IS NULL
  AND p.full_name LIKE 'Ученик%'; -- Only target our test students
  
END $$;

COMMIT;
