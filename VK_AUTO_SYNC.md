# Автосинхронизация новостей из VK

При появлении новых постов на https://vk.ru/lichnostplus они автоматически копируются на сайт. Уже импортированные новости не дублируются — вставляются только новые.

## Как работает

1. `pg_cron` (в базе Supabase) каждый час вызывает Edge Function `vk-auto-sync` через `pg_net` (`supabase/migrations/20260929080000_vk_auto_sync_cron.sql`).
2. Функция тянет последние 20 постов со стены через VK API `wall.get` (vk.com/vk.ru, домен `lichnostplus`).
3. Дедупликация: один батч-SELECT существующих постов по `source='vk'` + `source_id`. Вставляются только новые (`slug = vk-<id>`, категория «Новости»).
   Старые посты были импортированы без `source_id` — они сопоставляются по нормализованному заголовку, и им дозаписывается `source_id` (бэкфилл), чтобы дубли не появлялись. Проверено на реальных данных: из последних 20 постов стены — 2 новых, 18 найдены в базе.
4. Медиа поста (фото/видео/файлы/ссылки) и текст репостов (`copy_history`) собираются; фото/видео дописываются в `post_media` (галерея на странице новости).
5. Сайт (SPA) читает новости из Supabase — новые посты появляются без ручных действий.

Ручной импорт через админку (кнопка «Импорт VK») продолжает работать как раньше — функция `vk-batch-fetch` обновлена до версии из проекта gksfera: сбор всех вложений, `copy_history`, doc/audio/link, поддержка `vk.ru`, дедуп медиа.

## Деплой

### 1. Edge Functions (через Supabase CLI или Dashboard)

```bash
cd D:\!AiSite\slp23
supabase functions deploy vk-auto-sync --no-verify-jwt
supabase functions deploy vk-batch-fetch --no-verify-jwt
```

Через Dashboard: Edge Functions → создать/обновить `vk-auto-sync` и `vk-batch-fetch`, вставив содержимое соответствующих `index.ts`.

### 2. Расписание (SQL Editor)

Выполните SQL из `supabase/migrations/20260929080000_vk_auto_sync_cron.sql` в SQL Editor (Supabase Dashboard → проект `qwuicyhadpesklhkjxpn`). Он включает `pg_cron`/`pg_net` и создаёт задачу `vk-news-auto-sync` — каждый час, `0 * * * *`.

## Проверка

### Ручной запуск функции

```bash
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/vk-auto-sync `
  -H "Authorization: Bearer 36486c9354bf74d4561f743f301af82809b1c8750d25e" `
  -H "Content-Type: application/json" `
  -d "{}"
```

Ответ: `{"ok":true,"imported":N,"skipped":M,"total":T}` — `imported` = новых постов, `skipped` = уже существующих (не дублируются).

Повторный вызов должен вернуть `imported: 0` — дедупликация работает.

Без/с неверным секретом — `401 Unauthorized`.

### Логи

Supabase Dashboard → Edge Functions → `vk-auto-sync` → Logs. Ищите `[VK AutoSync]`.

## Возможные проблемы

| Проблема | Причина / решение |
|----------|-------------------|
| `401` при вызове из cron | Секрет в SQL (`Authorization: Bearer ...`) не совпадает с `VK_SYNC_SECRET` функции — приведите к одному значению |
| `VK API Error ... code: 15` | Лимит VK API — увеличьте интервал расписания (например `0 */2 * * *`) |
| Новость есть, но без галереи | Медиа не записались в `post_media` — смотрите логи `post_media insert error` |
| Функция не вызывается cron | Проверьте `SELECT * FROM cron.job` и `cron.job_run_details` на ошибки |

## Ротация секретов

Секрет триггера задан константой в `vk-auto-sync/index.ts` и в cron-SQL. Для ротации:
1. `supabase secrets set VK_SYNC_SECRET=<новый>` — функция возьмёт его из окружения;
2. обновите заголовок `Authorization` в `20260929080000_vk_auto_sync_cron.sql` и перезапустите задачу через SQL Editor;
3. не забудьте обновить константу в коде (fallback) при следующем деплое.
