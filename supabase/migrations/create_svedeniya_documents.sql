-- Таблица документов для раздела "Сведения об организации"
CREATE TABLE IF NOT EXISTS public.svedeniya_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id text NOT NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'doc', 'docx', 'xls', 'xlsx')),
  file_size bigint,
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Индекс для быстрого поиска по разделу
CREATE INDEX IF NOT EXISTS svedeniya_documents_section_id_idx
  ON public.svedeniya_documents (section_id, sort_order);

-- RLS
ALTER TABLE public.svedeniya_documents ENABLE ROW LEVEL SECURITY;

-- Публичное чтение видимых документов
DROP POLICY IF EXISTS "svedeniya_documents_public_read" ON public.svedeniya_documents;
CREATE POLICY "svedeniya_documents_public_read"
  ON public.svedeniya_documents
  FOR SELECT
  USING (is_visible = true);

-- Полный доступ для аутентифицированных администраторов
DROP POLICY IF EXISTS "svedeniya_documents_admin_all" ON public.svedeniya_documents;
CREATE POLICY "svedeniya_documents_admin_all"
  ON public.svedeniya_documents
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION update_svedeniya_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS svedeniya_documents_updated_at ON public.svedeniya_documents;
CREATE TRIGGER svedeniya_documents_updated_at
  BEFORE UPDATE ON public.svedeniya_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_svedeniya_documents_updated_at();

-- Создание bucket для документов
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies для bucket 'documents'
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_admin_upload" ON storage.objects;
CREATE POLICY "documents_admin_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "documents_admin_update" ON storage.objects;
CREATE POLICY "documents_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "documents_admin_delete" ON storage.objects;
CREATE POLICY "documents_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
