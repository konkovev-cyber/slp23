-- Track per-user homework completion
CREATE TABLE IF NOT EXISTS public.homework_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id integer NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (homework_id, user_id)
);

ALTER TABLE public.homework_completions ENABLE ROW LEVEL SECURITY;

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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homework_completions'
      AND policyname = 'Admins can manage homework completions'
  ) THEN
    CREATE POLICY "Admins can manage homework completions"
    ON public.homework_completions
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_homework_completions_user_id ON public.homework_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_completions_homework_id ON public.homework_completions(homework_id);
CREATE INDEX IF NOT EXISTS idx_homework_completions_completed_at ON public.homework_completions(completed_at);