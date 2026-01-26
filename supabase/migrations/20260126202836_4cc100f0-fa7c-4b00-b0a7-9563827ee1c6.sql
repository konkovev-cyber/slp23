-- Enable RLS (if not already)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Admin INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Admins can insert posts'
  ) THEN
    CREATE POLICY "Admins can insert posts"
    ON public.posts
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END$$;

-- Admin UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Admins can update posts'
  ) THEN
    CREATE POLICY "Admins can update posts"
    ON public.posts
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END$$;

-- Admin DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND policyname = 'Admins can delete posts'
  ) THEN
    CREATE POLICY "Admins can delete posts"
    ON public.posts
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END$$;