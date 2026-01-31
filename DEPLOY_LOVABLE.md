# 🚀 Инструкция по деплою на Lovable.app

## ✅ Шаг 1: Код уже в GitHub (ВЫПОЛНЕНО)

Все изменения успешно запушены в репозиторий:
- ✅ Миграция БД: `supabase/migrations/20260131160000_add_post_media.sql`
- ✅ Edge Function: `supabase/functions/fetch-metadata/index.ts`
- ✅ Frontend: `src/pages/AdminNews.tsx`
- ✅ Документация: 3 файла с инструкциями

## 📋 Шаг 2: Применить миграцию базы данных

### Вариант A: Через Lovable Dashboard (Рекомендуется)

1. **Откройте ваш проект на Lovable.app**
   - Перейдите на https://lovable.app
   - Выберите ваш проект `slp23`

2. **Перейдите в раздел Database**
   - В левом меню найдите "Database" или "Supabase"
   - Откройте SQL Editor

3. **Выполните миграцию**
   - Создайте новый SQL запрос
   - Скопируйте содержимое файла ниже
   - Нажмите "Run" или "Execute"

**SQL для выполнения:**
```sql
-- Create post_media table for multiple images per post
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'document')),
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- Anyone can read post media
CREATE POLICY "Post media are viewable by everyone"
  ON public.post_media FOR SELECT
  USING (true);

-- Only admins can insert post media
CREATE POLICY "Admins can insert post media"
  ON public.post_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update post media
CREATE POLICY "Admins can update post media"
  ON public.post_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete post media
CREATE POLICY "Admins can delete post media"
  ON public.post_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX idx_post_media_display_order ON public.post_media(post_id, display_order);
```

### Вариант B: Через Supabase Dashboard напрямую

1. **Откройте Supabase Dashboard**
   - Перейдите на https://supabase.com/dashboard
   - Выберите ваш проект

2. **SQL Editor**
   - В левом меню: SQL Editor → New Query
   - Вставьте SQL выше
   - Нажмите Run

## 📋 Шаг 3: Обновить Edge Function (если нужно)

Lovable обычно автоматически синхронизирует Edge Functions из GitHub, но если нужно обновить вручную:

1. **Откройте Lovable Dashboard**
2. **Перейдите в Edge Functions**
3. **Найдите функцию `fetch-metadata`**
4. **Обновите код** из файла `supabase/functions/fetch-metadata/index.ts`
5. **Сохраните и задеплойте**

## ✅ Шаг 4: Проверка

После деплоя проверьте:

1. **Откройте ваш сайт на Lovable**
   - URL: `https://[ваш-проект].lovable.app`

2. **Войдите в админ-панель**
   - Перейдите в раздел "Новости"
   - Нажмите "Добавить"

3. **Протестируйте импорт**
   - Вставьте ссылку: `https://t.me/life_news_gk/45392`
   - Нажмите "Импорт"
   - Проверьте:
     - ✅ Текст без кракозябр
     - ✅ Все изображения импортированы
     - ✅ Галерея показывает превью

## 🔍 Проверка миграции

Чтобы убедиться, что миграция применена:

```sql
-- Проверить существование таблицы
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'post_media'
);
-- Должно вернуть: true
```

## ⚠️ Важно

- **Автодеплой**: Lovable автоматически деплоит изменения из GitHub
- **Миграция БД**: Нужно применить вручную (один раз)
- **Edge Functions**: Обычно обновляются автоматически
- **Frontend**: Обновляется автоматически при push в GitHub

## 🎉 Готово!

После выполнения всех шагов:
- ✅ Код обновлен на Lovable
- ✅ База данных мигрирована
- ✅ Модуль импорта работает с правильной кодировкой
- ✅ Поддержка множественных изображений активна

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи в Lovable Dashboard
2. Проверьте консоль браузера (F12)
3. Убедитесь, что миграция применена успешно
4. Проверьте, что Edge Function обновлена

---

**Следующий шаг**: Примените SQL миграцию через Lovable Dashboard → Database → SQL Editor
