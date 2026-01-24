-- Storage buckets + policies for CMS media

-- 1) Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('images', 'images', true),
  ('news', 'news', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2) Policies on storage.objects
-- Public read
DO $$ BEGIN
  CREATE POLICY "Public read images bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read news bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'news');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read avatars bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin write (insert/update/delete)
DO $$ BEGIN
  CREATE POLICY "Admins can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- news
DO $$ BEGIN
  CREATE POLICY "Admins can upload news"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'news'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update news"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'news'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'news'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete news"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'news'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- avatars
DO $$ BEGIN
  CREATE POLICY "Admins can upload avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
