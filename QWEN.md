# slp23 — Проект сайта "Личность ПЛЮС"

## Обзор проекта

**slp23** — это многоплатформенное веб-приложение образовательного центра "Личность ПЛЮС", включающее:

- **Публичный сайт** с информацией о программах, курсах, преподавателях, новостях и контактах
- **Админ-панель** для управления контентом (новости, секции, медиа, преподаватели, роли, галерея, доска почёта)
- **Школьный портал (электронный дневник)** для студентов, учителей и родителей
- **Мобильное приложение (APK)** на базе Capacitor с отдельной точкой входа

Проект создан на базе **Lovable** и поддерживает двустороннюю синхронизацию с GitHub.

## Технологический стек

| Категория | Технологии |
|-----------|------------|
| **Фреймворк** | React 18.3, TypeScript 5.8 |
| **Сборка** | Vite 5.4 |
| **UI-библиотека** | shadcn-ui, Radix UI |
| **Стилизация** | Tailwind CSS 3.4 |
| **Роутинг** | React Router 6.30 |
| **State Management** | TanStack Query 5.83, TanStack Virtual 3.13 |
| **Формы** | React Hook Form 7.61, Zod валидация |
| **Бэкенд** | Supabase (Auth, Database, Storage, Edge Functions) |
| **Анимации** | Framer Motion 12.29 |
| **Мобильное приложение** | Capacitor 8.1 (Android) |
| **Тестирование** | Vitest 3.2, React Testing Library |
| **Линтинг** | ESLint 9.32 |
| **Деплой** | FTP (автоматизированный), Lovable, Vercel |

## Структура проекта

```
slp23/
├── src/
│   ├── components/          # React-компоненты
│   │   ├── ui/             # Базовые UI-компоненты (shadcn)
│   │   ├── admin/          # Компоненты админ-панели (ImageUploader, ImageCard, ImagePreviewDialog)
│   │   ├── school/         # Компоненты школьного портала (BottomNavigation, SchoolSidebar)
│   │   └── *.tsx           # Публичные компоненты (Header, Footer, HonorBoard, OptimizedImage)
│   ├── pages/              # Страницы приложения
│   │   ├── school/         # Страницы школьного портала
│   │   │   ├── admin/      # Администрирование школьного портала
│   │   │   └── *.tsx       # Страницы студентов/учителей/родителей
│   │   └── *.tsx           # Публичные и админ страницы
│   ├── integrations/
│   │   └── supabase/       # Supabase клиент и типы
│   ├── hooks/              # Кастомные React-хуки (useProfile, useCapacitorPlatform)
│   ├── lib/                # Утилиты (utils.ts, sanitize.ts)
│   ├── config/             # Конфигурация приложения (app-info.ts)
│   ├── types/              # TypeScript типы (diary.ts)
│   ├── assets/             # Статические ресурсы
│   └── test/               # Тестовые утилиты
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── fetch-metadata  # Извлечение метаданных (Telegram, VK, YouTube, Zen)
│   │   ├── news-import     # Импорт новостей
│   │   └── admin-*         # Функции управления пользователями
│   └── migrations/         # SQL миграции (25+ файлов)
├── android/                # Capacitor Android проект
├── plans/                  # Планы разработки
├── public/
│   ├── avatars/            # Аватары (100+ файлов)
│   └── manifest.json       # PWA манифест
├── *.md                    # Документация (30+ файлов)
└── *.config.{ts,js}        # Конфигурационные файлы
```

## Сборка и запуск

### Установка зависимостей

```bash
npm install
```

### Разработка

```bash
npm run dev
```

Сервер запустится на `http://localhost:8080` с HMR.

### Сборка

```bash
npm run build        # Продакшен сборка
npm run build:dev    # Сборка в режиме разработки
```

### Тестирование

```bash
npm test           # Запустить тесты один раз
npm run test:watch # Запустить тесты в режиме наблюдения
```

### Линтинг

```bash
npm run lint
```

### Деплой на FTP

```bash
npm run deploy       # Автоматический деплой через ftp-deploy.js
```

### Мобильное приложение (Android APK)

```bash
npm run build
npx cap sync android
cd android && .\gradlew assembleDebug
```

**APK файл:** `android/app/build/outputs/apk/debug/app-debug.apk`

## Переменные окружения

Файл `.env`:

```env
VITE_SUPABASE_URL="https://qwuicyhadpesklhkjxpn.supabase.co"
VITE_SUPABASE_PROJECT_ID="qwuicyhadpesklhkjxpn"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
```

## Ключевые возможности

### Публичные страницы

| Путь | Описание |
|------|----------|
| `/` | Главная страница с Hero-секцией |
| `/about` | О центре |
| `/programs` | Образовательные программы |
| `/clubs` | Клубы и секции |
| `/gallery` | Галерея |
| `/news` | Новости |
| `/news/:slug` | Страница новости |
| `/svedeniya` | Сведения об организации |
| `/contact` | Контакты |
| `/privacy` | Политика конфиденциальности |

### Админ-панель (`/admin/*`)

| Путь | Описание |
|------|----------|
| `/admin/login` | Вход для администраторов |
| `/admin/dashboard` | Дашборд |
| `/admin/news` | Новости (с импортом из Telegram/VK/YouTube/Zen) |
| `/admin/teachers` | Преподаватели |
| `/admin/sections` | Управление секциями сайта |
| `/admin/sections/hero` | Редактор Hero-секции |
| `/admin/media` | Медиафайлы |
| `/admin/gallery` | Галерея |
| `/admin/honor` | Доска почёта |
| `/admin/roles` | Роли пользователей |
| `/admin/access` | Доступ |
| `/admin/svedeniya` | Сведения |
| `/admin/instructions` | Инструкции |

### Школьный портал (`/school/*`)

**Студенты:**
- `/school/login` — Вход
- `/school/signup` — Регистрация
- `/school/diary` — Дневник
- `/school/grades` — Оценки
- `/school/schedule` — Расписание
- `/school/homework-list` — Домашние задания
- `/school/profile` — Профиль

**Учителя:**
- `/school/journal` — Журнал
- `/school/homework` — Назначение домашних заданий

**Родители:**
- `/school/children` — Дети (просмотр оценок и заданий)

**Администрирование:**
- `/school/admin/users` — Пользователи
- `/school/admin/classes` — Классы
- `/school/admin/schedule` — Расписание
- `/school/admin/grades` — Оценки

### Мобильное приложение (APK)

Отдельная версия приложения (`AppCapacitor.tsx`) с упрощённой навигацией:
- Открывается сразу на форме входа в школьный портал
- Нет доступа к публичному сайту и админ-панели
- Кнопка "Открыть сайт" открывает `slp23.ru` в браузере
- Нижняя навигационная панель (BottomNavigation)

**Конфигурация:** `capacitor.config.ts`
- **App ID:** `ru.slp23.app`
- **App Name:** Личность ПЛЮС
- **Launch Path:** `/school/login`

## Разработка

### Соглашения по коду

- **TypeScript**: Строгая типизация, типы в `src/types/`
- **Компоненты**: Функциональные компоненты с хуками
- **Стилизация**: Tailwind CSS с утилитарными классами
- **Импорт**: Алиас `@/` для директории `src/`
- **Именование**: PascalCase для компонентов, camelCase для функций/переменных

### Архитектурные паттерны

- **Lazy Loading**: Страницы загружаются лениво через `React.lazy()` + `Suspense`
- **Query Client**: TanStack Query для управления серверным состоянием
- **Protected Routes**: Компоненты `ProtectedRoute` и `SchoolProtectedRoute` для защиты роутов
- **Supabase Integration**: Типизированный клиент через `@/integrations/supabase/client`
- **Оптимизация изображений**: Компонент `OptimizedImage` с lazy loading и fallback

### Типы данных

Основные типы определены в `src/types/diary.ts`:
- `DiaryEntry`, `DaySchedule`, `ScheduleEntry` — дневник и расписание
- `HomeworkEntry`, `GradeEntry` — домашние задания и оценки
- `UserProfile`, `ParentChildRelation` — профили пользователей
- `StudentInfo`, `TeacherAssignment`, `ClassInfo`, `SubjectInfo` — справочники

### Хуки

- `useProfile()` — получение профиля текущего пользователя
- `useContent()` — управление контентом
- `useCapacitorPlatform()` — определение платформы (mobile/web)

### Supabase Edge Functions

| Функция | Описание |
|---------|----------|
| `fetch-metadata` | Извлечение метаданных из URL (Telegram, VK, YouTube, Zen, любые сайты) |
| `news-import` | Импорт новостей из внешних источников |
| `bootstrap-admin` | Создание первого администратора |
| `admin-create-user` | Создание пользователя |
| `admin-user-lookup` | Поиск пользователя |
| `admin-set-role` | Установка роли |
| `manage-users` | Управление пользователями |

**Конфигурация:** `supabase/config.toml` с `verify_jwt = false` для публичного доступа

## Импорт новостей

Модуль импорта (`AdminNews.tsx` + `fetch-metadata` Edge Function) поддерживает:

### Источники

- **Telegram**: `https://t.me/<channel>/<post_id>`
- **VK**: `https://vk.com/wall-<group_id>_<post_id>`, `https://vk.com/@...` (статьи)
- **YouTube**: `https://youtube.com/watch?v=...`, `https://youtu.be/...`
- **Zen (Дзен)**: `https://zen.yandex.ru/...`, `https://dzen.ru/...`
- **Любые сайты**: С поддержкой Open Graph метаданных

### Извлекаемые данные

- Заголовок, описание, полный текст
- Множественные изображения (сохраняются в таблицу `post_media`)
- Автоматическое определение кодировки (UTF-8, Windows-1251)
- Обработка HTML-сущностей

### Таблица post_media

```sql
CREATE TABLE post_media (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'document')),
  display_order INTEGER DEFAULT 0,
  alt_text TEXT
);
```

## Мобильная оптимизация

Сайт полностью адаптирован для мобильных устройств:

- Touch-target минимум 44x44px (Apple HIG)
- Размер шрифта в полях ввода 16px (предотвращает автозум на iOS)
- Адаптивная навигация с hamburger-меню
- BottomNavigation для мобильного приложения
- Оптимизированные отступы и размеры элементов

## База данных

### Основные таблицы

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей |
| `user_roles` | Роли пользователей |
| `posts` | Новости |
| `post_media` | Медиафайлы новостей (множественные изображения) |
| `sections` | Секции сайта |
| `section_items` | Элементы секций |
| `teachers` | Преподаватели |
| `gallery` | Галерея |
| `honor_board` | Доска почёта |
| `students`, `teachers`, `parents`, `classes`, `subjects` | Таблицы школьного портала |
| `diary_entries`, `grades`, `homework`, `schedules` | Дневник, оценки, ДЗ, расписание |

### Миграции

25+ SQL миграций в `supabase/migrations/`:
- Базовая схема сайта
- Школьный дневник (`20260131200000_diary_schema.sql`)
- Тестовые данные
- Исправления RLS и прав доступа

## Тестирование

Тесты пишутся с использованием **Vitest** и **React Testing Library**:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

**Конфигурация:** `vitest.config.ts`
- **Environment:** jsdom
- **Setup:** `src/test/setup.ts`
- **Pattern:** `src/**/*.{test,spec}.{ts,tsx}`

## Деплой

### Lovable Platform

1. Закоммитить и запушить изменения в GitHub (main branch)
2. Lovable автоматически задеплоит изменения
3. Применить SQL миграции через Lovable Dashboard → Database → SQL Editor
4. Задеплоить Edge Functions через Dashboard → Functions

### FTP (автоматизированный)

Скрипт `ftp-deploy.js`:

```bash
npm run deploy
```

**Конфигурация:** Переменные окружения в `.env` (FTP_HOST, FTP_USER, FTP_PASSWORD)

### Vercel

Проект настроен для деплоя на Vercel через `vercel.json`:

```json
{
  "rewrites": [{ "source": "/:path*", "destination": "/index.html" }]
}
```

### GitHub Releases (APK)

Релизы мобильных версий:
- **Tag:** `v1.0.1`, `v1.2.0`, `1.2.1`
- **APK файл:** `slp23.apk` (35.4 MB)
- **Ссылка:** https://github.com/konkovev-cyber/slp23/releases

## Документация

### Основные файлы

| Файл | Описание |
|------|----------|
| `README.md` | Общая информация о проекте |
| `QWEN.md` | Этот файл — контекст для AI-агентов |
| `DEPLOY_READY.md` | Готовый код для деплоя Edge Functions |
| `DEPLOY_CHECKLIST.md` | Чек-лист деплоя на Lovable |
| `NEWS_IMPORT_GUIDE.md` | Руководство по импорту новостей |
| `MOBILE_OPTIMIZATION.md` | Мобильная оптимизация |
| `TESTING_GUIDE.md` | Руководство по тестированию |
| `MIGRATION_GUIDE.md` | Руководство по миграции |
| `APK_RELEASE_INSTRUCTIONS.md` | Инструкция по релизу APK |
| `APK_BUILD_GUIDE.md` | Сборка мобильного приложения |
| `DIARY_ARCHITECTURE.md` | Архитектура электронного дневника |
| `TOOLKIT.md` | Инструменты разработки |
| `RELEASE_NOTES_v1.1.0.md` | Заметки о релизе |
| `FIX_REPORT_v1.2.0.md` | Отчёт об исправлениях |

### Планы развития

В директории `plans/`:
- `admin-media-improvement-plan.md` — Улучшение медиа
- `max_messenger_integration_plan.md` — Интеграция мессенджера
- `mobile_app_plan.md` — План разработки мобильного приложения

## Навыки AI-агентов

Проект включает обширную библиотеку навыков для AI-агентов в директории `.agent/skills/`:

- **backend-dev-guidelines** — Лучшие практики бэкенда
- **frontend-dev-guidelines** — Лучшие практики фронтенда
- **react-best-practices** — 50+ правил React (производительность, рендеринг, хуки)
- **typescript-expert** — Продвинутый TypeScript
- **testing-patterns** — Паттерны тестирования
- **security-auditor** — Аудит безопасности
- **deployment-engineer** — Деплой и CI/CD
- **docker-expert** — Docker контейнеризация
- **playwright-skill** — E2E тестирование
- **web-performance-optimization** — Оптимизация производительности

Всего **60+ файлов** с детальными руководствами и примерами.

## Примечания

- Проект создан через Lovable и поддерживает двустороннюю синхронизацию с GitHub
- Для локальной разработки требуется Node.js и npm
- Все изменения в UI-компонентах shadcn управляются через `components.json`
- Конфигурация TypeScript расслаблена (`noImplicitAny: false`, `strictNullChecks: false`) для гибкости
- **Версия приложения:** 1.0.1 (от 17 февраля 2026)
- **Последнее обновление:** 19 февраля 2026

## Полезные ссылки

- **GitHub:** https://github.com/konkovev-cyber/slp23
- **Сайт:** https://slp23.ru
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qwuicyhadpesklhkjxpn
- **Lovable:** https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID
