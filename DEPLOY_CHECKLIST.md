# ✅ Чек-лист деплоя на Lovable.app

## Статус выполнения

- [x] **Шаг 1**: Код закоммичен в Git
- [x] **Шаг 2**: Код запушен в GitHub (main branch)
- [ ] **Шаг 3**: Применить SQL миграцию в Lovable
- [ ] **Шаг 4**: Проверить работу импорта

---

## 🎯 Что нужно сделать СЕЙЧАС

### 1️⃣ Применить SQL миграцию

**Где**: Lovable Dashboard → Database → SQL Editor

**Что выполнить**: Скопируйте и выполните SQL из файла:
`supabase/migrations/20260131160000_add_post_media.sql`

**Или скопируйте отсюда:**

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

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post media are viewable by everyone"
  ON public.post_media FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert post media"
  ON public.post_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update post media"
  ON public.post_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete post media"
  ON public.post_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX idx_post_media_display_order ON public.post_media(post_id, display_order);
```

### 2️⃣ Проверить деплой

1. Откройте ваш сайт на Lovable
2. Войдите в админ-панель → Новости → Добавить
3. Вставьте тестовую ссылку: `https://t.me/life_news_gk/45392`
4. Нажмите "Импорт"
5. Убедитесь:
   - ✅ Текст читается нормально (не кракозябры)
   - ✅ Все изображения импортированы
   - ✅ Показывается галерея с превью

---

## 📝 Что уже сделано автоматически

Lovable автоматически задеплоил из GitHub:
- ✅ Обновленный `AdminNews.tsx` (форма импорта)
- ✅ Обновленный `fetch-metadata` Edge Function (обработка кодировки)
- ✅ Все новые файлы документации

**Осталось только**: Применить SQL миграцию вручную (один раз)

---

## 🔗 Полезные ссылки

- **Подробная инструкция**: `DEPLOY_LOVABLE.md`
- **Руководство пользователя**: `NEWS_IMPORT_GUIDE.md`
- **Резюме изменений**: `NEWS_IMPORT_SUMMARY.md`

---

## ❓ Если что-то не работает

1. **Проверьте логи** в Lovable Dashboard
2. **Откройте консоль браузера** (F12) и проверьте ошибки
3. **Убедитесь**, что SQL миграция выполнена успешно:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'post_media'
   );
   ```
   Должно вернуть: `true`

---

## 🎉 После успешного деплоя

Модуль импорта новостей будет работать с:
- ✅ Правильной кодировкой UTF-8
- ✅ Поддержкой множественных изображений
- ✅ Расширенными источниками (Telegram, VK, любые сайты)
- ✅ Визуальной галереей импортированных фото
