-- Автосинхронизация новостей из VK (vk.ru/lichnostplus) на сайт.
-- Расписание через pg_cron: каждый час вызывает Edge Function vk-auto-sync
-- через pg_net. Функция сама дедуплицирует: вставляет только посты,
-- которых ещё нет в public.posts (по source='vk' + source_id).

-- Расширения нужны один раз; CREATE IF NOT EXISTS не падает, если уже включены
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Удаляем старую задачу, если пересоздаём расписание
SELECT cron.unschedule('vk-news-auto-sync')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vk-news-auto-sync');

-- Каждый час: POST на vk-auto-sync с секретом триггера.
-- Если в vk-auto-sync переопределён секрет через `supabase secrets set
-- VK_SYNC_SECRET=...`, замените значение в заголовке ниже на то же самое.
SELECT cron.schedule(
  'vk-news-auto-sync',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/vk-auto-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer 36486c9354bf74d4561f743f301af82809b1c8750d25e',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
