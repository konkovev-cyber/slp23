-- CMS core tables: site_content, navigation_items, site_settings

-- 1) site_content
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY,
  section_name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Site content is viewable by everyone"
  ON public.site_content
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert site content"
  ON public.site_content
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update site content"
  ON public.site_content
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete site content"
  ON public.site_content
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_site_content_updated_at ON public.site_content;
CREATE TRIGGER trg_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 2) navigation_items
CREATE TABLE IF NOT EXISTS public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  parent_id UUID NULL REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'link',
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS navigation_items_area_sort_idx
ON public.navigation_items (area, sort_order);

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Navigation items are viewable by everyone"
  ON public.navigation_items
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert navigation items"
  ON public.navigation_items
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update navigation items"
  ON public.navigation_items
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete navigation items"
  ON public.navigation_items
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_navigation_items_updated_at ON public.navigation_items;
CREATE TRIGGER trg_navigation_items_updated_at
BEFORE UPDATE ON public.navigation_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 3) site_settings
-- Security note: this table can include PII (contacts). We allow public SELECT only for a whitelisted set of keys.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public can read selected site settings keys"
  ON public.site_settings
  FOR SELECT
  USING (key IN ('contacts','social','maps','seo_defaults','legal_public'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read all site settings"
  ON public.site_settings
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete site settings"
  ON public.site_settings
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
