-- Добавляем поля для расширенной информации о сотрудниках
ALTER TABLE public.teachers
    ADD COLUMN IF NOT EXISTS role_type TEXT NOT NULL DEFAULT 'teacher',
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS education TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS experience TEXT,
    ADD COLUMN IF NOT EXISTS subjects TEXT,
    ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Индекс для быстрой фильтрации по роли
CREATE INDEX IF NOT EXISTS idx_teachers_role_type ON public.teachers (role_type);

-- Обновляем политику: публичный просмотр всех преподавателей
DROP POLICY IF EXISTS "Teachers are viewable by everyone" ON public.teachers;
CREATE POLICY "Teachers are viewable by everyone"
    ON public.teachers FOR SELECT USING (true);

-- Администраторы управляют всеми
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers"
    ON public.teachers FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
