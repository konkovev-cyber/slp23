-- Add Role and Approval to Profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
    END IF;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'student',
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- School Classes
CREATE TABLE IF NOT EXISTS public.school_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(auth_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Link Students to Classes
CREATE TABLE IF NOT EXISTS public.students_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(auth_id) NOT NULL,
    class_id UUID REFERENCES public.school_classes(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id)
);

-- Teacher Assignments (which teacher teaches which subject)
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(auth_id) NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(teacher_id, subject_id)
);

-- Schedule / Timetable
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.school_classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id),
    teacher_id UUID REFERENCES public.profiles(auth_id),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    lesson_number INT NOT NULL,
    start_time TIME,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grades / Journal
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.teacher_assignments(id),
    grade TEXT NOT NULL,
    comment TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Homework
CREATE TABLE IF NOT EXISTS public.homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.teacher_assignments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date DATE,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Parent-Child Links
CREATE TABLE IF NOT EXISTS public.parent_children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.profiles(auth_id) NOT NULL,
    child_id UUID REFERENCES public.profiles(auth_id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(parent_id, child_id)
);

-- Enable RLS
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Viewable by authed" ON public.school_classes;
    DROP POLICY IF EXISTS "Viewable by authed" ON public.subjects;
    DROP POLICY IF EXISTS "Viewable by authed" ON public.students_info;
    DROP POLICY IF EXISTS "Viewable by authed" ON public.teacher_assignments;
    DROP POLICY IF EXISTS "Viewable by authed" ON public.schedule;
    DROP POLICY IF EXISTS "Viewable by authed" ON public.grades;
    DROP POLICY IF EXISTS "Viewable by authed" ON public.homework;
    DROP POLICY IF EXISTS "Viewable by authed" ON public.parent_children;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Policies (Simplified for now - viewable by authenticated)
CREATE POLICY "Viewable by authed" ON public.school_classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authed" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authed" ON public.students_info FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authed" ON public.teacher_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authed" ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authed" ON public.grades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authed" ON public.homework FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authed" ON public.parent_children FOR SELECT USING (auth.role() = 'authenticated');

-- Allow inserts/updates for authenticated users (will be refined later)
CREATE POLICY "Modifiable by authed" ON public.school_classes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifiable by authed" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifiable by authed" ON public.students_info FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifiable by authed" ON public.teacher_assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifiable by authed" ON public.schedule FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifiable by authed" ON public.grades FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifiable by authed" ON public.homework FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Modifiable by authed" ON public.parent_children FOR ALL USING (auth.role() = 'authenticated');
