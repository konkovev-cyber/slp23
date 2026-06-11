-- Разрешаем публичный доступ на чтение контента сайта, чтобы данные загружались у всех пользователей
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.site_content;
CREATE POLICY "Allow public read access" ON public.site_content FOR SELECT USING (true);