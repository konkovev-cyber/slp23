-- Create site_content table
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY,
  section_name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Site content viewable by everyone" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Seed initial data
INSERT INTO public.site_content (id, section_name, is_visible, content)
VALUES 
  ('hero', 'Главный блок (Hero)', true, '{}'),
  ('about', 'О школе', true, '{}'),
  ('programs', 'Программы', true, '{}'),
  ('clubs', 'Кружки и секции', true, '{}'),
  ('feedback', 'Отзывы', true, '{}'),
  ('gallery_section', 'Галерея (секция)', true, '{}'),
  ('settings', 'Настройки сайта', true, '{"maintenance_mode": false}')
ON CONFLICT (id) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
