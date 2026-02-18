# Исправление импорта новостей

## Что было исправлено (2026-02-19)

### Проблема
При импорте новостей из VK, Telegram и других источников функция `fetch-metadata` не могла корректно извлечь:
- Текст новости
- Изображения
- Заголовок

### Изменения в `supabase/functions/fetch-metadata/index.ts`

#### 1. Улучшено извлечение медиа (extractMedia)

**Для всех источников:**
- OG Image (Open Graph)
- Background images (CSS)
- Regular img tags
- Video links (YouTube, Vimeo, VK Video)

**Для VK:**
- `data-src` атрибуты (lazy loading)
- `srcset` атрибуты (адаптивные изображения)

**Для Telegram:**
- `data-webp` атрибуты
- `data-srcset` атрибуты
- `telegra.ph/file/*` ссылки

#### 2. Улучшено извлечение контента

**Telegram селекторы:**
- `.tgme_widget_message_text`
- `.tgme_widget_message_bubble`
- `.message-text`
- `[itemprop="articleBody"]`
- Fallback: `<p>` теги

**VK селекторы:**
- `.wall_post_text` (старая вёрстка)
- `.WallPostText` (новая вёрстка)
- `.post__text`
- `.page_post_content` (для статей)
- `[data-field="post"]`
- Fallback: `meta description`

**Обычные веб-сайты:**
- `<article>` теги
- `.article-content`
- `.post-content`
- `.entry-content`
- `[itemprop="articleBody"]`
- Fallback: Open Graph description

#### 3. Улучшено определение заголовка

**Для Telegram:**
- Если заголовок generic ("Telegram Widget", "Telegram : Contact") или короче 10 символов
- Используется первая строка из контента

**Для VK:**
- Если заголовок generic ("ВКонтакте", "Запись на стене")
- Используется первая строка из контента

**Для всех источников:**
- Если заголовок пустой, используется первая строка контента

#### 4. Добавлена поддержка новых источников

**Определение источника (source):**
- `telegram` — t.me/*
- `vk` — vk.com/*
- `youtube` — youtube.com/*, youtu.be/*
- `zen` — zen.yandex.ru/*, dzen.ru/*
- `web` — все остальные сайты

#### 5. Улучшена обработка URL

**Telegram:**
- Удаление `?single` параметра
- Сохранение оригинального URL для парсинга (без принудительного embed=1)

**Все источники:**
- Улучшенные HTTP заголовки (User-Agent, Accept)
- Правильная кодировка UTF-8

#### 6. Добавлено логирование для отладки

Выводятся в консоль:
- URL для Telegram
- Извлечённые метаданные
- Длина HTML
- Какой селектор сработал (для Telegram/VK)
- Длина найденного контента
- Количество найденных медиа
- Найден ли контент для обычных сайтов

## Как деплоить изменения

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдите в проект `qwuicyhadpesklhkjxpn`
3. Edge Functions → `fetch-metadata`
4. Скопируйте содержимое файла `supabase/functions/fetch-metadata/index.ts`
5. Вставьте в редактор на сайте Supabase
6. Нажмите **Deploy**

### Вариант 2: Через Supabase CLI

```bash
# Установка CLI (если не установлен)
npm install -g supabase

# Логин
supabase login

# Деплой функции
cd d:\1_sites\slp23
supabase functions deploy fetch-metadata
```

## Как тестировать

### Через админ-панель

1. Откройте https://slp23.ru/admin/news
2. Нажмите "Добавить новость"
3. Вставьте ссылку на источник:
   - **Telegram**: `https://t.me/...`
   - **VK**: `https://vk.com/...` или `https://vk.com/@...`
   - **YouTube**: `https://youtube.com/watch?v=...`
   - **Дзен**: `https://zen.yandex.ru/...`
   - **Сайт**: любой URL с Open Graph метаданными
4. Нажмите "Импорт"
5. Проверьте, что:
   - ✅ Заголовок заполнен (не "ВКонтакте" или "Telegram Widget")
   - ✅ Текст новости извлечён
   - ✅ Изображение найдено
   - ✅ Медиа-галерея заполнена (если есть несколько изображений)

### Через консоль (для разработчиков)

```bash
# Telegram
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://t.me/slp23/123"}'

# VK
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://vk.com/@lichnostplus-..."}'

# YouTube
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=..."}'

# Веб-сайт
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

## Логи

Для просмотра логов Edge Function:

1. Supabase Dashboard → Edge Functions → `fetch-metadata`
2. Вкладка **Logs**
3. Ищите сообщения с префиксом `DEBUG:`

Примеры логов:
```
DEBUG: Telegram URL: https://t.me/slp23/123
DEBUG: Extracted metadata: { title: "...", description: "...", image: "..." }
DEBUG: HTML length: 45678
DEBUG: Trying Telegram selectors...
DEBUG: TG Selector: ...tgme_widget_message_text... Match: YES
DEBUG: Found Telegram content, length: 523
DEBUG: Media list count: 3

DEBUG: Trying VK selectors...
DEBUG: Selector: ...wall_post_text... Match: NO
DEBUG: Selector: ...WallPostText... Match: YES
DEBUG: Found content, length: 789
DEBUG: Media list count: 5

DEBUG: Found article content, length: 1234
DEBUG: Media list count: 2
```

## Возможные проблемы

### 1. "Не удалось загрузить данные"

**Причина:** Источник блокирует запросы с серверов Supabase

**Решение:**
- Проверьте, что URL доступен из браузера
- Для Telegram попробуйте добавить `?single=1` к URL
- Используйте зеркало или кэшированную версию

### 2. "Пустой контент"

**Причина:** Источник изменил вёрстку

**Решение:**
1. Откройте страницу в браузере
2. View Source (Ctrl+U)
3. Найдите класс контейнера с текстом (ищите по фрагменту текста)
4. Добавьте новый селектор в соответствующий массив:
   - `telegramSelectors` — для Telegram
   - `selectors` — для VK
   - `articleContentSelectors` — для веб-сайтов

### 3. "Нет изображений"

**Причина:** Изображения загружаются через JS или в нестандартных атрибутах

**Решение:**
- Проверьте логи — должно быть `DEBUG: Media list count: X`
- Если 0, значит изображения не найдены в HTML
- Добавьте новый тип атрибута в функцию `extractMedia()`:
  ```typescript
  const customMatches = html.matchAll(/data-custom=["']([^"']+)["']/gi);
  // ... добавить обработку
  ```

### 4. "Неправильный заголовок"

**Причина:** OG:title содержит мусор или слишком короткий

**Решение:**
- Проверьте логи — видно, какой заголовок извлечён
- Добавьте паттерн в `GENERIC_TITLES` если заголовок определяется как generic
- Уменьшите порог длины в проверке `finalTitle.length < 10`

## Поддерживаемые источники

| Источник | URL паттерн | Контент | Изображения | Видео |
|----------|-------------|---------|-------------|-------|
| **Telegram** | t.me/* | ✅ | ✅ | ✅ |
| **VK** | vk.com/*, vk.com/@* | ✅ | ✅ | ✅ |
| **YouTube** | youtube.com, youtu.be | ✅ (описание) | ✅ | ✅ |
| **Дзен** | zen.yandex.ru, dzen.ru | ✅ | ✅ | ❌ |
| **Веб-сайты** | любые | ✅ (Open Graph + CMS) | ✅ | ❌ |

## Контакты

При возникновении проблем обращайтесь к разработчику или создайте issue в GitHub репозитории проекта.
