-- ============================================================================
-- Миграция: Создание таблиц дневника (Diary/Journal)
-- Версия: 1.0.0
-- Дата: 2026-02-10
-- Описание: Создание таблиц для системы дневника ученика
-- ============================================================================

-- Включаем расширение для UUID (если еще не включено)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Таблица: profiles (Профили пользователей)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    auth_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Россия',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- ============================================================================
-- Таблица: user_roles (Роли пользователей)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Индексы для user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ============================================================================
-- Таблица: parents_children (Связь родителей и детей)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parents_children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'parent', -- parent, guardian, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, child_id)
);

-- Индексы для parents_children
CREATE INDEX IF NOT EXISTS idx_parents_children_parent_id ON public.parents_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parents_children_child_id ON public.parents_children(child_id);

-- ============================================================================
-- Таблица: diary_entries (Записи дневника)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE SET NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(50) CHECK (mood IN ('excellent', 'good', 'neutral', 'concerning', 'poor')),
    behavior_rating INTEGER CHECK (behavior_rating >= 1 AND behavior_rating <= 5),
    academic_performance TEXT,
    achievements TEXT[],
    concerns TEXT[],
    recommendations TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для diary_entries
CREATE INDEX IF NOT EXISTS idx_diary_entries_student_id ON public.diary_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_teacher_id ON public.diary_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON public.diary_entries(date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON public.diary_entries(created_at DESC);

-- ============================================================================
-- Таблица: diary_attachments (Вложения к записям дневника)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diary_entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для diary_attachments
CREATE INDEX IF NOT EXISTS idx_diary_attachments_entry_id ON public.diary_attachments(diary_entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_attachments_uploaded_by ON public.diary_attachments(uploaded_by);

-- ============================================================================
-- Таблица: diary_comments (Комментарии к записям дневника)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diary_entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- true = только для учителей, false = виден родителям
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для diary_comments
CREATE INDEX IF NOT EXISTS idx_diary_comments_entry_id ON public.diary_comments(diary_entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_comments_author_id ON public.diary_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_diary_comments_created_at ON public.diary_comments(created_at DESC);

-- ============================================================================
-- Таблица: diary_visibility (Настройки видимости записей)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diary_entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    visible_to_student BOOLEAN DEFAULT true,
    visible_to_parents BOOLEAN DEFAULT true,
    visible_to_teachers BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(diary_entry_id)
);

-- ============================================================================
-- Таблица: diary_templates (Шаблоны записей дневника)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Таблица: diary_tags (Теги для записей дневника)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- HEX цвет
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Таблица: diary_entry_tags (Связь записей и тегов)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_entry_tags (
    diary_entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.diary_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (diary_entry_id, tag_id)
);

-- ============================================================================
-- Таблица: diary_notifications (Уведомления о записях дневника)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diary_entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    notification_type VARCHAR(50) CHECK (notification_type IN ('new_entry', 'new_comment', 'update')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для diary_notifications
CREATE INDEX IF NOT EXISTS idx_diary_notifications_recipient_id ON public.diary_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_diary_notifications_is_read ON public.diary_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_diary_notifications_created_at ON public.diary_notifications(created_at DESC);

-- ============================================================================
-- Таблица: diary_parent_feedback (Обратная связь от родителей)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diary_parent_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diary_entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для diary_parent_feedback
CREATE INDEX IF NOT EXISTS idx_diary_parent_feedback_entry_id ON public.diary_parent_feedback(diary_entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_parent_feedback_parent_id ON public.diary_parent_feedback(parent_id);

-- ============================================================================
-- Функция: Обновление updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER trigger_diary_entries_updated_at
    BEFORE UPDATE ON public.diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_diary_updated_at();

CREATE TRIGGER trigger_diary_comments_updated_at
    BEFORE UPDATE ON public.diary_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_diary_updated_at();

CREATE TRIGGER trigger_diary_visibility_updated_at
    BEFORE UPDATE ON public.diary_visibility
    FOR EACH ROW
    EXECUTE FUNCTION public.update_diary_updated_at();

CREATE TRIGGER trigger_diary_templates_updated_at
    BEFORE UPDATE ON public.diary_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_diary_updated_at();

CREATE TRIGGER trigger_diary_parent_feedback_updated_at
    BEFORE UPDATE ON public.diary_parent_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_diary_updated_at();

-- ============================================================================
-- Row Level Security (RLS) Политики
-- ============================================================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_parent_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Политики для profiles
-- ============================================================================

-- Все авторизованные пользователи могут видеть профили
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Пользователи могут видеть свой профиль
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth_id = auth.uid());

-- Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth_id = auth.uid());

-- ============================================================================
-- RLS Политики для user_roles
-- ============================================================================

-- Все авторизованные пользователи могут видеть роли
CREATE POLICY "Authenticated users can view user roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Пользователи могут видеть свои роли
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid());

-- ============================================================================
-- RLS Политики для parents_children
-- ============================================================================

-- Все авторизованные пользователи могут видеть связи родителей и детей
CREATE POLICY "Authenticated users can view parent-child relationships"
    ON public.parents_children FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Родители могут видеть связи со своими детьми
CREATE POLICY "Parents can view their children"
    ON public.parents_children FOR SELECT
    USING (parent_id = auth.uid());

-- Дети могут видеть связи со своими родителями
CREATE POLICY "Children can view their parents"
    ON public.parents_children FOR SELECT
    USING (child_id = auth.uid());

-- ============================================================================
-- RLS Политики для diary_entries
-- ============================================================================

-- Учителя могут читать записи своих учеников
CREATE POLICY "Teachers can view their students' diary entries"
    ON public.diary_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
        OR student_id = auth.uid()
    );

-- Учителя могут создавать записи для своих учеников
CREATE POLICY "Teachers can create diary entries for their students"
    ON public.diary_entries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
    );

-- Учителя могут обновлять записи, которые создали
CREATE POLICY "Teachers can update their own diary entries"
    ON public.diary_entries FOR UPDATE
    USING (
        teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Учителя могут удалять записи, которые создали
CREATE POLICY "Teachers can delete their own diary entries"
    ON public.diary_entries FOR DELETE
    USING (
        teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- ============================================================================
-- RLS Политики для diary_attachments
-- ============================================================================

-- Пользователи могут видеть вложения к доступным им записям
CREATE POLICY "Users can view attachments for accessible diary entries"
    ON public.diary_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.diary_entries
            WHERE diary_entries.id = diary_attachments.diary_entry_id
            AND (
                diary_entries.student_id = auth.uid()
                OR diary_entries.teacher_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role IN ('admin', 'teacher')
                )
            )
        )
    );

-- Учителя могут создавать вложения
CREATE POLICY "Teachers can create attachments"
    ON public.diary_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
    );

-- ============================================================================
-- RLS Политики для diary_comments
-- ============================================================================

-- Пользователи могут видеть комментарии к доступным им записям
CREATE POLICY "Users can view comments for accessible diary entries"
    ON public.diary_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.diary_entries
            WHERE diary_entries.id = diary_comments.diary_entry_id
            AND (
                diary_entries.student_id = auth.uid()
                OR diary_entries.teacher_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role IN ('admin', 'teacher')
                )
            )
        )
        AND (
            NOT is_internal
            OR EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.role IN ('admin', 'teacher')
            )
        )
    );

-- Учителя и родители могут создавать комментарии
CREATE POLICY "Teachers and parents can create comments"
    ON public.diary_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher', 'parent')
        )
    );

-- Авторы могут обновлять свои комментарии
CREATE POLICY "Authors can update their own comments"
    ON public.diary_comments FOR UPDATE
    USING (author_id = auth.uid());

-- ============================================================================
-- RLS Политики для diary_visibility
-- ============================================================================

-- Учителя могут видеть настройки видимости
CREATE POLICY "Teachers can view visibility settings"
    ON public.diary_visibility FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
    );

-- Учителя могут обновлять настройки видимости
CREATE POLICY "Teachers can update visibility settings"
    ON public.diary_visibility FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
    );

-- ============================================================================
-- RLS Политики для diary_templates
-- ============================================================================

-- Учителя могут видеть активные шаблоны
CREATE POLICY "Teachers can view active templates"
    ON public.diary_templates FOR SELECT
    USING (
        is_active = true
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Учителя могут создавать шаблоны
CREATE POLICY "Teachers can create templates"
    ON public.diary_templates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
    );

-- Авторы могут обновлять свои шаблоны
CREATE POLICY "Authors can update their own templates"
    ON public.diary_templates FOR UPDATE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- ============================================================================
-- RLS Политики для diary_tags
-- ============================================================================

-- Все авторизованные пользователи могут видеть теги
CREATE POLICY "Authenticated users can view tags"
    ON public.diary_tags FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Учителя могут создавать теги
CREATE POLICY "Teachers can create tags"
    ON public.diary_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
    );

-- ============================================================================
-- RLS Политики для diary_entry_tags
-- ============================================================================

-- Все авторизованные пользователи могут видеть связи записей и тегов
CREATE POLICY "Authenticated users can view entry tags"
    ON public.diary_entry_tags FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Учителя могут создавать связи записей и тегов
CREATE POLICY "Teachers can create entry tags"
    ON public.diary_entry_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'teacher')
        )
    );

-- ============================================================================
-- RLS Политики для diary_notifications
-- ============================================================================

-- Пользователи могут видеть свои уведомления
CREATE POLICY "Users can view their own notifications"
    ON public.diary_notifications FOR SELECT
    USING (recipient_id = auth.uid());

-- Пользователи могут обновлять свои уведомления
CREATE POLICY "Users can update their own notifications"
    ON public.diary_notifications FOR UPDATE
    USING (recipient_id = auth.uid());

-- ============================================================================
-- RLS Политики для diary_parent_feedback
-- ============================================================================

-- Учителя могут видеть обратную связь для записей своих учеников
CREATE POLICY "Teachers can view parent feedback"
    ON public.diary_parent_feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.diary_entries
            WHERE diary_entries.id = diary_parent_feedback.diary_entry_id
            AND (
                diary_entries.teacher_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_roles.user_id = auth.uid()
                    AND user_roles.role = 'admin'
                )
            )
        )
        OR parent_id = auth.uid()
    );

-- Родители могут создавать обратную связь
CREATE POLICY "Parents can create feedback"
    ON public.diary_parent_feedback FOR INSERT
    WITH CHECK (
        parent_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('parent', 'admin')
        )
    );

-- ============================================================================
-- Вставка начальных данных (теги по умолчанию)
-- ============================================================================

INSERT INTO public.diary_tags (name, color) VALUES
    ('Академический успех', '#10B981'),
    ('Поведение', '#3B82F6'),
    ('Социальные навыки', '#8B5CF6'),
    ('Творчество', '#F59E0B'),
    ('Спорт', '#EF4444'),
    ('Внеурочная деятельность', '#EC4899'),
    ('Требует внимания', '#F97316'),
    ('Отличная работа', '#059669')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Создание функции для получения записей дневника с учетом видимости
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_accessible_diary_entries(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    teacher_id UUID,
    date DATE,
    title VARCHAR(255),
    content TEXT,
    mood VARCHAR(50),
    behavior_rating INTEGER,
    academic_performance TEXT,
    achievements TEXT[],
    concerns TEXT[],
    recommendations TEXT,
    is_private BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    visible_to_student BOOLEAN,
    visible_to_parents BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.student_id,
        de.teacher_id,
        de.date,
        de.title,
        de.content,
        de.mood,
        de.behavior_rating,
        de.academic_performance,
        de.achievements,
        de.concerns,
        de.recommendations,
        de.is_private,
        de.created_at,
        de.updated_at,
        dv.visible_to_student,
        dv.visible_to_parents
    FROM public.diary_entries de
    LEFT JOIN public.diary_visibility dv ON de.id = dv.diary_entry_id
    WHERE
        -- Пользователь - автор записи (учитель)
        de.teacher_id = p_user_id
        OR
        -- Пользователь - ученик и запись видна ученикам
        (de.student_id = p_user_id AND (dv.visible_to_student = true OR dv.visible_to_student IS NULL))
        OR
        -- Пользователь - родитель ученика и запись видна родителям
        (
            EXISTS (
                SELECT 1 FROM public.parents_children pc
                WHERE pc.child_id = de.student_id
                AND pc.parent_id = p_user_id
            )
            AND (dv.visible_to_parents = true OR dv.visible_to_parents IS NULL)
        )
        OR
        -- Пользователь - администратор
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = p_user_id
            AND user_roles.role = 'admin'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Создание функции для создания уведомления о новой записи
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_diary_entry_created()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    -- Создаем уведомления для родителей ученика
    FOR v_parent_id IN
        SELECT parent_id FROM public.parents_children
        WHERE child_id = NEW.student_id
    LOOP
        INSERT INTO public.diary_notifications (diary_entry_id, recipient_id, notification_type)
        VALUES (NEW.id, v_parent_id, 'new_entry');
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического создания уведомлений
CREATE TRIGGER trigger_notify_diary_entry_created
    AFTER INSERT ON public.diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_diary_entry_created();

-- ============================================================================
-- Комментарий завершения миграции
-- ============================================================================
COMMENT ON TABLE public.profiles IS 'Профили пользователей системы';
COMMENT ON TABLE public.user_roles IS 'Роли пользователей (admin, teacher, parent, student)';
COMMENT ON TABLE public.parents_children IS 'Связь родителей и детей';
COMMENT ON TABLE public.diary_entries IS 'Записи дневника ученика';
COMMENT ON TABLE public.diary_attachments IS 'Вложения к записям дневника';
COMMENT ON TABLE public.diary_comments IS 'Комментарии к записям дневника';
COMMENT ON TABLE public.diary_visibility IS 'Настройки видимости записей дневника';
COMMENT ON TABLE public.diary_templates IS 'Шаблоны записей дневника';
COMMENT ON TABLE public.diary_tags IS 'Теги для записей дневника';
COMMENT ON TABLE public.diary_entry_tags IS 'Связь записей и тегов';
COMMENT ON TABLE public.diary_notifications IS 'Уведомления о записях дневника';
COMMENT ON TABLE public.diary_parent_feedback IS 'Обратная связь от родителей';

-- ============================================================================
-- Конец миграции
-- ============================================================================
