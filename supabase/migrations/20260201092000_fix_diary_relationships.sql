-- Fix relationships for better PostgREST joins
-- We point directly to public.profiles(auth_id) because student_id/teacher_id in our tables
-- are auth.users(id), which corresponds to profiles(auth_id).

-- 1. Grades
ALTER TABLE public.grades 
DROP CONSTRAINT IF EXISTS grades_student_id_fkey,
ADD CONSTRAINT grades_student_id_profiles_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(auth_id) ON DELETE CASCADE;

-- 2. Teacher Assignments
ALTER TABLE public.teacher_assignments 
DROP CONSTRAINT IF EXISTS teacher_assignments_teacher_id_fkey,
ADD CONSTRAINT teacher_assignments_teacher_id_profiles_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.profiles(auth_id) ON DELETE CASCADE;

-- 3. Schedule
ALTER TABLE public.schedule 
DROP CONSTRAINT IF EXISTS schedule_teacher_id_fkey,
ADD CONSTRAINT schedule_teacher_id_profiles_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.profiles(auth_id) ON DELETE CASCADE;

-- 4. Students Info
ALTER TABLE public.students_info 
DROP CONSTRAINT IF EXISTS students_info_student_id_fkey,
ADD CONSTRAINT students_info_student_id_profiles_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(auth_id) ON DELETE CASCADE;

-- 5. Parents-Children
ALTER TABLE public.parents_children 
DROP CONSTRAINT IF EXISTS parents_children_parent_id_fkey,
DROP CONSTRAINT IF EXISTS parents_children_child_id_fkey,
ADD CONSTRAINT parents_children_parent_id_profiles_fkey 
FOREIGN KEY (parent_id) REFERENCES public.profiles(auth_id) ON DELETE CASCADE;

ALTER TABLE public.parents_children
ADD CONSTRAINT parents_children_child_id_profiles_fkey 
FOREIGN KEY (child_id) REFERENCES public.profiles(auth_id) ON DELETE CASCADE;
