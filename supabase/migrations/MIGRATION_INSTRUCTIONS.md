# Инструкция по выполнению миграции таблиц дневника

## Обзор

Данный документ содержит инструкции по выполнению миграции SQL для создания таблиц дневника в Supabase.

## Предварительные требования

- Учетная запись Supabase с доступом к проекту
- Supabase CLI (опционально)
- Данные подключения:
  - URL: `https://qwuicyhadpesklhkjxpn.supabase.co`
  - Пароль: `rmlp7xxSwv5E7NPY`

---

## Способ 1: Через SQL редактор в браузере

### Шаг 1: Вход в Supabase

1. Откройте браузер и перейдите по адресу: https://supabase.com/dashboard
2. Войдите в свою учетную запись
3. Выберите проект: `qwuicyhadpesklhkjxpn`

### Шаг 2: Открытие SQL редактора

1. В левом меню выберите **SQL Editor**
2. Нажмите кнопку **New query** для создания нового запроса

### Шаг 3: Выполнение миграции

1. Откройте файл `supabase/migrations/create_diary_tables.sql` в текстовом редакторе
2. Скопируйте всё содержимое файла
3. Вставьте код в SQL редактор Supabase
4. Нажмите кнопку **Run** (или `Ctrl+Enter`) для выполнения

### Шаг 4: Проверка результатов

После успешного выполнения вы должны увидеть сообщение:
```
Success. No rows returned
```

Для проверки созданных таблиц выполните следующий запрос:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'diary_%'
ORDER BY table_name;
```

Ожидаемый результат:
```
table_name
------------------
diary_attachments
diary_comments
diary_entries
diary_entry_tags
diary_notifications
diary_parent_feedback
diary_tags
diary_templates
diary_visibility
```

---

## Способ 2: Через Supabase CLI

### Шаг 1: Установка Supabase CLI (если не установлен)

**Windows (PowerShell):**
```powershell
winget install supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
curl -fsSL https://supabase.com/install.sh | bash
```

### Шаг 2: Вход в Supabase

```bash
supabase login
```

Введите ваш токен доступа (можно получить в настройках аккаунта Supabase).

### Шаг 3: Подключение к проекту

```bash
supabase link --project-ref qwuicyhadpesklhkjxpn
```

### Шаг 4: Выполнение миграции

```bash
supabase db push
```

Или для выполнения конкретного файла:

```bash
psql "postgresql://postgres.qwuicyhadpesklhkjxpn:rmlp7xxSwv5E7NPY@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/create_diary_tables.sql
```

---

## Способ 3: Через psql (командная строка)

### Шаг 1: Установка psql (если не установлен)

**Windows:**
- Скачайте PostgreSQL с официального сайта: https://www.postgresql.org/download/windows/

**macOS:**
```bash
brew install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

### Шаг 2: Подключение к базе данных

```bash
psql "postgresql://postgres.qwuicyhadpesklhkjxpn:rmlp7xxSwv5E7NPY@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

### Шаг 3: Выполнение миграции

Внутри psql выполните:

```sql
\i supabase/migrations/create_diary_tables.sql
```

Или из командной строки:

```bash
psql "postgresql://postgres.qwuicyhadpesklhkjxpn:rmlp7xxSwv5E7NPY@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/create_diary_tables.sql
```

---

## Проверка после миграции

### 1. Проверка созданных таблиц

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'diary_%'
ORDER BY table_name;
```

### 2. Проверка RLS политик

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename LIKE 'diary_%'
ORDER BY tablename, policyname;
```

### 3. Проверка индексов

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename LIKE 'diary_%'
ORDER BY tablename, indexname;
```

### 4. Проверка триггеров

```sql
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table LIKE 'diary_%'
ORDER BY event_object_table, trigger_name;
```

### 5. Проверка начальных данных (теги)

```sql
SELECT * FROM public.diary_tags ORDER BY name;
```

---

## Структура созданных таблиц

| Таблица | Описание |
|---------|----------|
| `diary_entries` | Основные записи дневника ученика |
| `diary_attachments` | Вложения (файлы) к записям |
| `diary_comments` | Комментарии к записям |
| `diary_visibility` | Настройки видимости записей |
| `diary_templates` | Шаблоны для создания записей |
| `diary_tags` | Теги для категоризации записей |
| `diary_entry_tags` | Связь записей и тегов |
| `diary_notifications` | Уведомления о записях |
| `diary_parent_feedback` | Обратная связь от родителей |

---

## RLS Политики безопасности

Миграция создает следующие политики безопасности:

- **Учителя** могут читать, создавать, обновлять и удалять записи своих учеников
- **Родители** могут видеть записи своих детей (если не помечены как приватные)
- **Ученики** могут видеть свои записи (если не помечены как приватные)
- **Администраторы** имеют полный доступ ко всем записям

---

## Устранение неполадок

### Ошибка: "relation already exists"

Если таблица уже существует, вы можете сначала удалить её:

```sql
DROP TABLE IF EXISTS public.diary_entries CASCADE;
DROP TABLE IF EXISTS public.diary_attachments CASCADE;
DROP TABLE IF EXISTS public.diary_comments CASCADE;
DROP TABLE IF EXISTS public.diary_visibility CASCADE;
DROP TABLE IF EXISTS public.diary_templates CASCADE;
DROP TABLE IF EXISTS public.diary_tags CASCADE;
DROP TABLE IF EXISTS public.diary_entry_tags CASCADE;
DROP TABLE IF EXISTS public.diary_notifications CASCADE;
DROP TABLE IF EXISTS public.diary_parent_feedback CASCADE;
```

Затем выполните миграцию заново.

### Ошибка: "permission denied"

Убедитесь, что вы используете правильные учетные данные и что у вас есть права администратора в проекте Supabase.

### Ошибка: "function already exists"

Если функция уже существует, скрипт использует `CREATE OR REPLACE`, поэтому ошибка не должна возникать.

---

## Следующие шаги

После успешной миграции:

1. Обновите типы TypeScript в `src/integrations/supabase/types.ts`
2. Создайте хуки для работы с дневником (например, `use-diary.ts`)
3. Создайте компоненты UI для отображения записей дневника
4. Добавьте страницы для управления дневником

---

## Контакты

При возникновении проблем с миграцией обратитесь к документации Supabase:
- https://supabase.com/docs/guides/database/migrations
- https://supabase.com/docs/guides/auth/row-level-security
