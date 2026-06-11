-- ============================================================================
-- Миграция: Исправление RLS политик для Supabase Storage
-- Дата: 2026-06-11
-- Проблема: "new row violates row-level security policy" при загрузке фото
-- ============================================================================

-- Бакет images: публичный просмотр, загрузка только для авторизованных
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Бакет documents: публичный просмотр
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- ============================================================================
-- Storage RLS политики для бакета images
-- ============================================================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Images public read" ON storage.objects;
DROP POLICY IF EXISTS "Images admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Images admin update" ON storage.objects;
DROP POLICY IF EXISTS "Images admin delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete images" ON storage.objects;

-- 1. Все могут читать файлы из images и documents
CREATE POLICY "Public read all buckets"
ON storage.objects FOR SELECT
USING (bucket_id IN ('images', 'documents', 'avatars', 'news'));

-- 2. Авторизованные пользователи могут загружать в images
CREATE POLICY "Authenticated upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 3. Авторизованные пользователи могут загружать документы
CREATE POLICY "Authenticated upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- 4. Авторизованные пользователи могут загружать аватары
CREATE POLICY "Authenticated upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 5. Авторизованные пользователи могут загружать в news
CREATE POLICY "Authenticated upload news"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news');

-- 6. Удалять могут только сами загрузившие ИЛИ админы
CREATE POLICY "Owner or admin delete storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  auth.uid() = owner
  OR public.is_admin(auth.uid())
);

-- 7. Обновление (переименование) — только владелец или админ  
CREATE POLICY "Owner or admin update storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  auth.uid() = owner
  OR public.is_admin(auth.uid())
);
