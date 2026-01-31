-- 1) Update app_role enum
-- Note: Outside transaction if needed, but here we assume clear migration run
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- 2) Profiles extension
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) School Classes
CREATE TABLE IF NOT EXISTS public.school_classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;

-- 4) Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 5) Students Info
CREATE TABLE IF NOT EXISTS public.students_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  class_id INT REFERENCES public.school_classes(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.students_info ENABLE ROW LEVEL SECURITY;

-- 6) Parents-Children relation
CREATE TABLE IF NOT EXISTS public.parents_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, child_id),
  CHECK(parent_id != child_id)
);

ALTER TABLE public.parents_children ENABLE ROW LEVEL SECURITY;

-- 7) Teacher Assignments
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id INT REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  class_id INT REFERENCES public.school_classes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, subject_id, class_id)
);

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 8) Grades
CREATE TABLE IF NOT EXISTS public.grades (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  teacher_assignment_id INT REFERENCES public.teacher_assignments(id) ON DELETE CASCADE NOT NULL,
  grade TEXT NOT NULL,
  comment TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- 9) Homework
CREATE TABLE IF NOT EXISTS public.homework (
  id SERIAL PRIMARY KEY,
  teacher_assignment_id INT REFERENCES public.teacher_assignments(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- 10) Homework Files
CREATE TABLE IF NOT EXISTS public.homework_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id INT REFERENCES public.homework(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.homework_files ENABLE ROW LEVEL SECURITY;

-- 11) Schedule
CREATE TABLE IF NOT EXISTS public.schedule (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES public.school_classes(id) ON DELETE CASCADE NOT NULL,
  subject_id INT REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL,
  lesson_number INT CHECK (lesson_number > 0) NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, day_of_week, lesson_number)
);

ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_teacher(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'teacher');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_student(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'student');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_parent(_user_id UUID) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'parent');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.is_teacher_of_assignment(_user_id UUID, _assignment_id INT) RETURNS BOOLEAN STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_assignments WHERE id = _assignment_id AND teacher_id = _user_id);
$$ LANGUAGE sql;

-- POLICIES (Simplified for migration, can be refined based on iDnevnik)
-- Profiles
DO $$ BEGIN
  CREATE POLICY "Profiles readable by auth" ON public.profiles FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Profiles updateable by self/admin" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = auth_id OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Classes, Subjects, Schedule
DO $$ BEGIN
  CREATE POLICY "School data readable by auth" ON public.school_classes FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Subjects readable by auth" ON public.subjects FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Schedule readable by auth" ON public.schedule FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Grades RLS
DO $$ BEGIN
  CREATE POLICY "Grades viewable by student/parent/teacher/admin" ON public.grades FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR student_id = auth.uid()
    OR (public.is_parent(auth.uid()) AND student_id IN (SELECT child_id FROM public.parents_children WHERE parent_id = auth.uid()))
    OR (public.is_teacher(auth.uid()) AND public.is_teacher_of_assignment(auth.uid(), teacher_assignment_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CRUD for school data limited to admin/teacher accordingly
DO $$ BEGIN
  CREATE POLICY "Admin CRUD classes" ON public.school_classes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  CREATE POLICY "Admin CRUD subjects" ON public.subjects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  CREATE POLICY "Admin CRUD schedule" ON public.schedule FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  CREATE POLICY "Teacher/Admin CRUD grades" ON public.grades FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_teacher(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
