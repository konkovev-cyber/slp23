-- ============================================================================
-- Миграция: исправление прав доступа для публичных таблиц и создание homework_completions
-- Дата: 2026-11-17
-- ============================================================================

-- 1. Выдача прав SELECT для анонимных пользователей на публичные таблицы
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Таблица учителей и руководства (для главной страницы и раздела /svedeniya)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teachers') THEN
        GRANT SELECT ON public.teachers TO anon, authenticated;
    END IF;
END $$;

-- Таблица фотогалереи (для главной страницы и /gallery)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery') THEN
        GRANT SELECT ON public.gallery TO anon, authenticated;
    END IF;
END $$;

-- Политики RLS для teachers (убеждаемся что публичный SELECT разрешён)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'teachers' AND policyname = 'Teachers are viewable by everyone'
    ) THEN
        CREATE POLICY "Teachers are viewable by everyone" ON public.teachers FOR SELECT USING (true);
    END IF;
END $$;

-- Политики RLS для gallery (убеждаемся что публичный SELECT разрешён)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery') THEN
        ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'gallery' AND policyname = 'Gallery images are viewable by everyone'
        ) THEN
            CREATE POLICY "Gallery images are viewable by everyone" ON public.gallery FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'gallery' AND policyname = 'Admins can manage gallery'
        ) THEN
            CREATE POLICY "Admins can manage gallery" ON public.gallery FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
        END IF;
    END IF;
END $$;

-- 2. Создание таблицы homework_completions
CREATE TABLE IF NOT EXISTS public.homework_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id integer NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (homework_id, user_id)
);

ALTER TABLE public.homework_completions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_completions TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homework_completions'
      AND policyname = 'Users can view own homework completions'
  ) THEN
    CREATE POLICY "Users can view own homework completions"
    ON public.homework_completions
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homework_completions'
      AND policyname = 'Users can insert own homework completions'
  ) THEN
    CREATE POLICY "Users can insert own homework completions"
    ON public.homework_completions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homework_completions'
      AND policyname = 'Users can delete own homework completions'
  ) THEN
    CREATE POLICY "Users can delete own homework completions"
    ON public.homework_completions
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Доступ для администраторов к заявкам с контактной формы
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_requests') THEN
        GRANT SELECT, UPDATE, DELETE ON public.contact_requests TO authenticated;
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'contact_requests' AND policyname = 'Admins can manage contact requests'
        ) THEN
            CREATE POLICY "Admins can manage contact requests" 
            ON public.contact_requests 
            FOR ALL 
            TO authenticated
            USING (public.has_role(auth.uid(), 'admin'::public.app_role))
            WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
        END IF;
    END IF;
END $$;
