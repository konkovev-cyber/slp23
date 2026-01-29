-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL, -- Position / Subject
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Teachers are viewable by everyone"
  ON public.teachers
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage teachers"
  ON public.teachers
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
