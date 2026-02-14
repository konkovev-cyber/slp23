# 🚀 План миграции сайта с Lovable.app на собственный хостинг

## 📋 Обзор проекта

**Название проекта:** Личность ПЛЮС — Частная школа в Горячем Ключе

**Технологический стек:**
- Frontend: React 18.3.1 + TypeScript 5.8.3
- Build tool: Vite 5.4.19
- Styling: Tailwind CSS 3.4.17 + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage)
- State management: @tanstack/react-query 5.83.0
- Routing: react-router-dom 6.30.1
- Package manager: npm (с поддержкой bun.lockb)

**Текущий хостинг:** Lovable.app
**Целевой хостинг:** Собственный хостинг (VPS/облачный сервер)

---

## 🎯 Цели миграции

1. Перенести фронтенд-приложение с Lovable.app на собственный хостинг
2. Сохранить интеграцию с Supabase (база данных, авторизация, хранилище)
3. Обеспечить непрерывную работу сайта во время миграции
4. Настроить автоматический деплой через CI/CD
5. Настроить SSL сертификат и домен

---

## 📊 Диаграмма миграции

```mermaid
graph TB
    A[Текущее состояние<br/>Lovable.app] --> B[Этап 1: Подготовка]
    B --> C[Этап 2: Настройка хостинга]
    C --> D[Этап 3: Перенос кода]
    D --> E[Этап 4: Интеграция Supabase]
    E --> F[Этап 5: Тестирование]
    F --> G[Этап 6: Запуск]
    G --> H[Новое состояние<br/>Собственный хостинг]
    
    style A fill:#ff6b6b
    style H fill:#51cf66
    style B fill:#ffd43b
    style C fill:#ffd43b
    style D fill:#ffd43b
    style E fill:#ffd43b
    style F fill:#ffd43b
    style G fill:#ffd43b
```

---

## 📦 ЭТАП 1: Подготовка к переносу

### 1.1 Резервное копирование

#### Резервное копирование кода
```bash
# Создать резервную копию текущего состояния
cd d:/1_sites/slp23
git add .
git commit -m "Backup before migration to self-hosted"
git tag backup-before-migration-$(date +%Y%m%d)
git push origin main --tags
```

#### Резервное копирование базы данных Supabase
```bash
# Установить Supabase CLI (если не установлен)
npm install -g supabase

# Войти в Supabase
supabase login

# Создать дамп базы данных
supabase db dump -f backup_$(date +%Y%m%d).sql --project-id qwuicyhadpesklhkjxpn

# Или через pg_dump
pg_dump -h db.qwuicyhadpesklhkjxpn.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

#### Резервное копирование хранилища Supabase
```bash
# Скачать все файлы из хранилища
# Через Supabase Dashboard: Storage → Download all buckets
# Или через Supabase CLI
supabase storage cp --recursive --project-id qwuicyhadpesklhkjxpn . ./storage-backup
```

### 1.2 Проверка зависимостей

#### Проверка package.json
```bash
# Проверить все зависимости
npm list --depth=0

# Обновить зависимости до последних версий
npm update

# Проверить уязвимости
npm audit
npm audit fix
```

#### Ключевые зависимости для проверки
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.91.1",
    "@tanstack/react-query": "^5.83.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "vite": "^5.4.19"
  }
}
```

### 1.3 Проверка конфигураций

#### Проверка переменных окружения (.env)
```bash
# Текущие переменные (из .env файла)
VITE_SUPABASE_PROJECT_ID="vwfwtpshwghuonoekwzk"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://vwfwtpshwghuonoekwzk.supabase.co"
```

#### Новые переменные для собственного хостинга
```bash
# Создать файл .env.production
VITE_SUPABASE_PROJECT_ID="qwuicyhadpesklhkjxpn"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dWljeWhhZHBlc2tsaGtqeHBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTA2OTQsImV4cCI6MjA4NjMyNjY5NH0.1-YshhpvgrRHlavDHZ9OjuGHj-p_GfNw-eM2DwfzDAU"
VITE_SUPABASE_URL="https://qwuicyhadpesklhkjxpn.supabase.co"
VITE_APP_URL="https://ваш-домен.ru"
VITE_API_URL="https://api.ваш-домен.ru"
```

### 1.4 Подготовка к продакшен-сборке

#### Тестовая сборка
```bash
# Установить зависимости
npm install

# Запустить тестовую сборку
npm run build

# Проверить результат сборки
ls -la dist/
```

#### Проверка локально
```bash
# Запустить preview сервер
npm run preview

# Открыть в браузере
# http://localhost:4173
```

---

## 🖥️ ЭТАП 2: Настройка хостинга и домена

### 2.1 Выбор хостинг-провайдера

#### Рекомендуемые варианты:

| Провайдер | Преимущества | Примерная цена |
|-----------|--------------|----------------|
| DigitalOcean Droplet | Простой, дешевый, надежный | $6-12/мес |
| Linode (Akamai) | Высокая производительность | $5-20/мес |
| Hetzner | Очень дешевый, в Европе | $4-10/мес |
| AWS Lightsail | Интеграция с AWS | $3.5-20/мес |
| Vercel (Self-hosted) | Простой деплой, но платный | $20+/мес |
| Netlify (Self-hosted) | Простой деплой, CDN | $19+/мес |

#### Минимальные требования к серверу:
- CPU: 2 vCPU
- RAM: 2 GB
- SSD: 40 GB
- OS: Ubuntu 22.04 LTS или 24.04 LTS
- Пропускная способность: 2 TB/мес

### 2.2 Настройка VPS (пример для Ubuntu 22.04)

#### Подключение к серверу
```bash
# Подключиться по SSH
ssh root@ваш-ip-адрес

# Обновить систему
apt update && apt upgrade -y

# Установить необходимые пакеты
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw fail2ban
```

#### Настройка firewall
```bash
# Настроить UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Проверить статус
ufw status
```

#### Создать пользователя для деплоя
```bash
# Создать пользователя
adduser deploy

# Добавить в sudo group
usermod -aG sudo deploy

# Настроить SSH ключи
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Скопировать ваш публичный ключ
echo "ваш-публичный-ssh-ключ" > /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### 2.3 Установка Node.js и npm

#### Установка через NodeSource
```bash
# Установить Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Проверить версию
node -v  # Должно быть v20.x.x
npm -v   # Должно быть 10.x.x
```

#### Установка PM2 (Process Manager)
```bash
# Установить PM2 глобально
npm install -g pm2

# Настроить автозапуск при старте сервера
pm2 startup
pm2 save
```

### 2.4 Настройка домена

#### Настройка DNS записей
```
Тип    Имя            Значение                    TTL
A      @              ваш-ip-адрес                300
A      www            ваш-ip-адрес                300
CNAME  api            ваш-домен.ru                300
```

#### Проверка DNS
```bash
# Проверить A запись
dig A ваш-домен.ru

# Проверить www
dig A www.ваш-домен.ru
```

---

## 📤 ЭТАП 3: Перенос кода на новый хостинг

### 3.1 Настройка Git репозитория на сервере

#### Инициализация bare репозитория
```bash
# Переключиться на пользователя deploy
su - deploy

# Создать директорию для bare репозитория
mkdir -p ~/repos/slp23.git
cd ~/repos/slp23.git

# Инициализировать bare репозиторий
git init --bare

# Создать post-receive hook
cat > hooks/post-receive << 'EOF'
#!/bin/bash
GIT_WORK_TREE=/var/www/slp23 git checkout -f
cd /var/www/slp23
npm install
npm run build
pm2 restart slp23
EOF

# Сделать hook исполняемым
chmod +x hooks/post-receive
```

#### Создать директорию для сайта
```bash
# Создать директорию для сайта
sudo mkdir -p /var/www/slp23
sudo chown -R deploy:deploy /var/www/slp23

# Клонировать репозиторий
cd /var/www
git clone /home/deploy/repos/slp23.git slp23
```

### 3.2 Настройка локального Git для деплоя

#### Добавить remote для продакшен
```bash
# На локальной машине
cd d:/1_sites/slp23

# Добавить remote для продакшен
git remote add production deploy@ваш-домен.ru:~/repos/slp23.git

# Или по IP
git remote add production deploy@ваш-ip-адрес:~/repos/slp23.git
```

#### Первый деплой
```bash
# Деплой на продакшен
git push production main
```

### 3.3 Настройка CI/CD (опционально)

#### GitHub Actions
Создать файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      
      - name: Deploy to server
        uses: easingthemes/ssh-deploy@v4
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /var/www/slp23
          SOURCE: dist/
```

#### Настройка секретов в GitHub
1. Перейти в Settings → Secrets and variables → Actions
2. Добавить следующие секреты:
   - `SSH_PRIVATE_KEY`: Ваш приватный SSH ключ
   - `REMOTE_HOST`: IP адрес или домен сервера
   - `REMOTE_USER`: deploy
   - `VITE_SUPABASE_URL`: https://qwuicyhadpesklhkjxpn.supabase.co
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

---

## 🔌 ЭТАП 4: Интеграция с Supabase

### 4.1 Обновление конфигурации Supabase

#### Обновить src/integrations/supabase/client.ts
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'slp23-website',
    },
  },
});
```

#### Обновить supabase/config.toml
```toml
project_id = "qwuicyhadpesklhkjxpn"

[api]
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
port = 54323

[ingest]
port = 54324

[storage]
file_size_limit = "50MiB"

[auth]
site_url = "https://ваш-домен.ru"
additional_redirect_urls = ["https://www.ваш-домен.ru"]
jwt_expiry = 3600

[functions.bootstrap-admin]
verify_jwt = false

[functions.admin-create-user]
verify_jwt = false

[functions.admin-user-lookup]
verify_jwt = false

[functions.admin-set-role]
verify_jwt = false

[functions.news-fill-images]
verify_jwt = false
```

### 4.2 Настройка CORS в Supabase

#### Через Supabase Dashboard
1. Перейти в https://supabase.com/dashboard/project/qwuicyhadpesklhkjxpn
2. Settings → API
3. В разделе "CORS allowed origins" добавить:
   - `https://ваш-домен.ru`
   - `https://www.ваш-домен.ru`
   - `http://localhost:5173` (для разработки)

#### Через SQL
```sql
-- Добавить CORS настройки
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'sb_secret_HzH8nQFmVqlvM95VQGoJnQ_y2FfA5vC';

-- Обновить URL редиректа
UPDATE auth.clients 
SET redirect_url = 'https://ваш-домен.ru/**'
WHERE name = 'slp23-website';
```

### 4.3 Применение миграций базы данных

#### Применить все миграции
```bash
# На сервере
cd /var/www/slp23

# Установить Supabase CLI
npm install -g supabase

# Войти в Supabase
supabase login --token sb_secret_HzH8nQFmVqlvM95VQGoJnQ_y2FfA5vC

# Применить миграции
supabase db push --project-id qwuicyhadpesklhkjxpn
```

#### Или вручную через SQL Editor
Выполнить все миграции из `supabase/migrations/` в порядке:
1. `20260124083601_0fa76cdb-753d-4c58-a64a-0d24fb6a463c.sql`
2. `20260124083713_e1ef0939-5aec-48bc-8c27-d65e039e5d28.sql`
3. `20260124090427_82c5d406-97d0-4ae6-bfdb-c88e05a4ccb9.sql`
4. `20260124090904_20cf02ef-6c20-4a4a-9d53-d36e91230824.sql`
5. `20260124091630_2cbe9393-9e28-4a79-97d0-8ade5eff433d.sql`
6. `20260124092128_bd0357c5-ea0e-43b8-b4bd-3e7711c2622f.sql`
7. `20260126202836_4cc100f0-fa7c-4b00-b0a7-9563827ee1c6.sql`
8. `20260129153000_teachers.sql`
9. `20260129173000_fix_categories.sql`
10. `20260131160000_add_post_media.sql`
11. `20260131200000_diary_schema.sql`
12. `20260201092000_fix_diary_relationships.sql`
13. `20260201100000_populate_test_data.sql`
14. `20260202110500_massive_test_data.sql`
15. `20260202114500_fix_rls_and_permissions.sql`
16. `20260205051832_87a73fff-4a37-4c0f-bc66-b6fcfd63207b.sql`

### 4.4 Деплой Edge Functions

#### Деплой всех функций
```bash
# На сервере
cd /var/www/slp23

# Деплой все функции
supabase functions deploy --project-id qwuicyhadpesklhkjxpn

# Или по отдельности
supabase functions deploy bootstrap-admin --project-id qwuicyhadpesklhkjxpn
supabase functions deploy admin-create-user --project-id qwuicyhadpesklhkjxpn
supabase functions deploy admin-set-role --project-id qwuicyhadpesklhkjxpn
supabase functions deploy admin-user-lookup --project-id qwuicyhadpesklhkjxpn
supabase functions deploy fetch-metadata --project-id qwuicyhadpesklhkjxpn
supabase functions deploy news-import --project-id qwuicyhadpesklhkjxpn
```

---

## 🌐 ЭТАП 5: Настройка веб-сервера

### 5.1 Настройка Nginx

#### Создать конфигурацию сайта
```bash
# Создать конфигурацию
sudo nano /etc/nginx/sites-available/slp23
```

#### Содержимое конфигурации
```nginx
# /etc/nginx/sites-available/slp23
server {
    listen 80;
    listen [::]:80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    # Перенаправление на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ваш-домен.ru www.ваш-домен.ru;

    # SSL сертификат (будет настроен через certbot)
    ssl_certificate /etc/letsencrypt/live/ваш-домен.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ваш-домен.ru/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Корневая директория
    root /var/www/slp23/dist;
    index index.html;

    # Логи
    access_log /var/log/nginx/slp23_access.log;
    error_log /var/log/nginx/slp23_error.log;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Статические файлы с кэшированием
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Запрет доступа к скрытым файлам
    location ~ /\. {
        deny all;
    }
}
```

#### Активировать сайт
```bash
# Создать символическую ссылку
sudo ln -s /etc/nginx/sites-available/slp23 /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

### 5.2 Настройка SSL сертификата (Let's Encrypt)

#### Получить сертификат
```bash
# Получить сертификат
sudo certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru

# Следовать инструкциям:
# 1. Ввести email для уведомлений
# 2. Согласиться с условиями
# 3. Выбрать перенаправление HTTP на HTTPS
```

#### Настроить автообновление
```bash
# Проверить автообновление
sudo certbot renew --dry-run

# Certbot автоматически добавляет cron job
# Проверить:
sudo systemctl status certbot.timer
```

### 5.3 Настройка PM2 для запуска приложения

#### Создать ecosystem файл
```bash
# На сервере
cd /var/www/slp23

# Создать ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'slp23',
    script: 'npm',
    args: 'run preview',
    cwd: '/var/www/slp23',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/slp23-error.log',
    out_file: '/var/log/pm2/slp23-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
```

#### Запустить приложение через PM2
```bash
# Создать директорию для логов
sudo mkdir -p /var/log/pm2
sudo chown -R deploy:deploy /var/log/pm2

# Запустить приложение
pm2 start ecosystem.config.js

# Сохранить конфигурацию
pm2 save

# Настроить автозапуск
pm2 startup
```

#### Альтернатива: статический хостинг через Nginx
Для Vite приложений лучше использовать статический хостинг:

```bash
# Сборка проекта
cd /var/www/slp23
npm run build

# Nginx уже настроен для обслуживания статических файлов
# PM2 не требуется для статических сайтов
```

---

## 🧪 ЭТАП 6: Тестирование и запуск

### 6.1 Локальное тестирование

#### Тестирование сборки
```bash
# На локальной машине
cd d:/1_sites/slp23

# Установить зависимости
npm install

# Запустить тесты
npm test

# Сборка для продакшен
npm run build

# Локальный preview
npm run preview
```

#### Проверка всех маршрутов
```
✅ / - Главная страница
✅ /about - О школе
✅ /programs - Программы
✅ /clubs - Кружки
✅ /clubs/:slug - Детали кружка
✅ /gallery - Галерея
✅ /news - Новости
✅ /news/:slug - Детали новости
✅ /svedeniya - Сведения об образовательной организации
✅ /contact - Контакты
✅ /privacy - Политика конфиденциальности
✅ /admin - Вход в админку
✅ /admin/dashboard - Дашборд
✅ /admin/access - Управление доступом
✅ /admin/roles - Роли
✅ /admin/news - Новости
✅ /admin/teachers - Преподаватели
✅ /admin/svedeniya - Сведения
✅ /admin/sections - Секции
✅ /admin/media - Медиа
✅ /admin/instructions - Инструкции
✅ /school/diary - Дневник ученика
✅ /school/grades - Оценки
✅ /school/schedule - Расписание
✅ /school/homework-list - Домашние задания
✅ /school/profile - Профиль
✅ /school/journal - Журнал учителя
✅ /school/homework - Домашние задания учителя
✅ /school/children - Дети родителя
✅ /school/admin/users - Пользователи
✅ /school/admin/classes - Классы
✅ /school/admin/schedule - Расписание
✅ /school/admin/grades - Оценки
```

### 6.2 Тестирование на сервере

#### Проверка Nginx
```bash
# Проверить статус Nginx
sudo systemctl status nginx

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

#### Проверка PM2 (если используется)
```bash
# Проверить статус PM2
pm2 status

# Проверить логи
pm2 logs slp23

# Перезапустить приложение
pm2 restart slp23
```

#### Проверка DNS
```bash
# Проверить A запись
dig A ваш-домен.ru

# Проверить www
dig A www.ваш-домен.ru

# Проверить SSL
openssl s_client -connect ваш-домен.ru:443
```

### 6.3 Функциональное тестирование

#### Тестирование авторизации
```bash
# 1. Открыть https://ваш-домен.ru/admin
# 2. Попробовать войти с существующими учетными данными
# 3. Проверить редирект на /admin/dashboard
# 4. Проверить работу всех админских функций
```

#### Тестирование Supabase интеграции
```bash
# 1. Открыть DevTools (F12)
# 2. Перейти на вкладку Network
# 3. Проверить запросы к Supabase API
# 4. Убедиться, что все запросы успешны (200 OK)
```

#### Тестирование Edge Functions
```bash
# 1. Открыть https://ваш-домен.ru/admin/news
# 2. Попробовать импортировать новость из Telegram
# 3. Проверить, что функция fetch-metadata работает
```

### 6.4 Производительность и оптимизация

#### Проверка скорости загрузки
```bash
# Использовать Google PageSpeed Insights
# https://pagespeed.web.dev/?url=https://ваш-домен.ru

# Использовать Lighthouse в Chrome DevTools
# 1. Открыть https://ваш-домен.ru
# 2. F12 → Lighthouse
# 3. Запустить анализ
```

#### Оптимизация изображений
```bash
# Проверить, что vite-plugin-image-optimizer работает
# Изображения должны быть оптимизированы и конвертированы в WebP
```

#### Настройка кэширования
```nginx
# Добавить в Nginx конфигурацию
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

---

## 🚀 ЭТАП 7: Запуск и мониторинг

### 7.1 Окончательный запуск

#### Переключение DNS
```bash
# Изменить DNS записи на вашем регистраторе домена
# A запись: ваш-домен.ru → ваш-ip-адрес
# A запись: www.ваш-домен.ru → ваш-ip-адрес

# Подождать распространения DNS (обычно 5-30 минут)
# Проверить:
dig A ваш-домен.ru
```

#### Проверка работы сайта
```bash
# Открыть сайт в браузере
https://ваш-домен.ru

# Проверить все страницы
# Проверить авторизацию
# Проверить админ-панель
# Проверить школьный портал
```

### 7.2 Настройка мониторинга

#### Настройка логов
```bash
# Создать директорию для логов
sudo mkdir -p /var/log/slp23
sudo chown -R deploy:deploy /var/log/slp23

# Настроить logrotate
sudo nano /etc/logrotate.d/slp23
```

#### Содержимое logrotate
```
/var/log/nginx/slp23_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

#### Настройка мониторинга через UptimeRobot
1. Зарегистрироваться на https://uptimerobot.com
2. Добавить монитор для https://ваш-домен.ru
3. Настроить уведомления на email/Telegram

### 7.3 Настройка бэкапов

#### Автоматический бэкап базы данных
```bash
# Создать скрипт бэкапа
sudo nano /usr/local/bin/backup-supabase.sh
```

#### Содержимое скрипта бэкапа
```bash
#!/bin/bash
# /usr/local/bin/backup-supabase.sh

BACKUP_DIR="/var/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/slp23_$DATE.sql"

# Создать директорию
mkdir -p $BACKUP_DIR

# Создать дамп
pg_dump -h db.qwuicyhadpesklhkjxpn.supabase.co -U postgres -d postgres > $BACKUP_FILE

# Сжать
gzip $BACKUP_FILE

# Удалить старые бэкапы (старше 30 дней)
find $BACKUP_DIR -name "slp23_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Настройка cron для автоматического бэкапа
```bash
# Сделать скрипт исполняемым
sudo chmod +x /usr/local/bin/backup-supabase.sh

# Добавить в crontab
sudo crontab -e

# Добавить строку для ежедневного бэкапа в 2:00 ночи
0 2 * * * /usr/local/bin/backup-supabase.sh >> /var/log/backup.log 2>&1
```

---

## ⚠️ ВОЗМОЖНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема 1: Ошибка сборки на сервере

**Симптомы:**
```
Error: Cannot find module '...'
npm ERR! code ELIFECYCLE
```

**Решение:**
```bash
# Очистить кэш npm
npm cache clean --force

# Удалить node_modules и package-lock.json
rm -rf node_modules package-lock.json

# Переустановить зависимости
npm install

# Попробовать сборку снова
npm run build
```

### Проблема 2: Ошибка подключения к Supabase

**Симптомы:**
```
Error: Invalid API key
Error: Connection refused
```

**Решение:**
```bash
# Проверить переменные окружения
cat .env.production

# Убедиться, что ключи правильные
# VITE_SUPABASE_URL должен быть: https://qwuicyhadpesklhkjxpn.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY должен начинаться с eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

# Проверить CORS настройки в Supabase Dashboard
# Settings → API → CORS allowed origins
```

### Проблема 3: Ошибка авторизации

**Симптомы:**
```
Error: Auth session missing
Error: Invalid JWT
```

**Решение:**
```sql
-- Обновить URL редиректа в Supabase
UPDATE auth.clients 
SET redirect_url = 'https://ваш-домен.ru/**'
WHERE name = 'slp23-website';

-- Или через Supabase Dashboard
# Authentication → URL Configuration
# Site URL: https://ваш-домен.ru
# Redirect URLs: https://ваш-домен.ru/**
```

### Проблема 4: 404 ошибки на SPA маршрутах

**Симптомы:**
```
При обновлении страницы /about выдает 404
```

**Решение:**
```nginx
# Добавить в Nginx конфигурацию
location / {
    try_files $uri $uri/ /index.html;
}
```

### Проблема 5: Ошибка SSL сертификата

**Симптомы:**
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Решение:**
```bash
# Получить новый сертификат
sudo certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru --force-renewal

# Проверить сертификат
sudo certbot certificates

# Перезапустить Nginx
sudo systemctl restart nginx
```

### Проблема 6: Медленная загрузка сайта

**Симптомы:**
```
Сайт загружается медленно, низкий балл PageSpeed
```

**Решение:**
```bash
# 1. Включить сжатие в Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

# 2. Настроить кэширование статических файлов
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 3. Оптимизировать изображения
# Убедиться, что vite-plugin-image-optimizer работает

# 4. Использовать CDN для статических файлов
# Настроить Cloudflare или другой CDN
```

### Проблема 7: Ошибка Edge Functions

**Симптомы:**
```
Error: Function not found
Error: 500 Internal Server Error
```

**Решение:**
```bash
# Проверить, что функции задеплоены
supabase functions list --project-id qwuicyhadpesklhkjxpn

# Задеплоить функции снова
supabase functions deploy --project-id qwuicyhadpesklhkjxpn

# Проверить логи функций
supabase functions logs fetch-metadata --project-id qwuicyhadpesklhkjxpn
```

### Проблема 8: Ошибка памяти на сервере

**Симптомы:**
```
OOM Killer killed process
Сайт перестает отвечать
```

**Решение:**
```bash
# 1. Проверить использование памяти
free -h

# 2. Создать swap файл
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Добавить в /etc/fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 4. Настроить swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Проблема 9: Ошибка при импорте новостей

**Симптомы:**
```
Error: Failed to fetch metadata
Кракозябры в тексте
```

**Решение:**
```bash
# Проверить Edge Function fetch-metadata
supabase functions logs fetch-metadata --project-id qwuicyhadpesklhkjxpn

# Проверить кодировку в функции
# Убедиться, что используется UTF-8

# Проверить CORS настройки
# Добавить источник новостей в CORS allowed origins
```

### Проблема 10: DNS не обновляется

**Симптомы:**
```
Сайт не открывается по домену
dig показывает старый IP
```

**Решение:**
```bash
# 1. Проверить TTL записи
dig A ваш-домен.ru

# 2. Очистить локальный DNS кэш
# Windows:
ipconfig /flushdns

# Linux:
sudo systemd-resolve --flush-caches

# 3. Использовать публичный DNS для проверки
nslookup ваш-домен.ru 8.8.8.8

# 4. Подождать до 48 часов для полного распространения DNS
```

---

## 📝 Чек-лист миграции

### Подготовка
- [ ] Создать резервную копию кода (git commit + tag)
- [ ] Создать резервную копию базы данных Supabase
- [ ] Создать резервную копию хранилища Supabase
- [ ] Проверить все зависимости (npm audit)
- [ ] Создать .env.production файл
- [ ] Протестировать локальную сборку (npm run build)
- [ ] Протестировать локальный preview (npm run preview)

### Хостинг
- [ ] Купить VPS/облачный сервер
- [ ] Подключиться к серверу по SSH
- [ ] Обновить систему (apt update && apt upgrade)
- [ ] Установить Nginx, Certbot, UFW, Fail2ban
- [ ] Настроить firewall (UFW)
- [ ] Создать пользователя deploy
- [ ] Установить Node.js 20 LTS
- [ ] Установить PM2
- [ ] Настроить DNS записи (A, CNAME)
- [ ] Проверить DNS propagation

### Код
- [ ] Создать bare Git репозиторий на сервере
- [ ] Настроить post-receive hook
- [ ] Создать директорию /var/www/slp23
- [ ] Добавить production remote в локальный Git
- [ ] Сделать первый деплой (git push production main)
- [ ] Настроить GitHub Actions (опционально)

### Supabase
- [ ] Обновить src/integrations/supabase/client.ts
- [ ] Обновить supabase/config.toml
- [ ] Настроить CORS в Supabase Dashboard
- [ ] Применить все миграции базы данных
- [ ] Задеплоить все Edge Functions
- [ ] Проверить подключение к Supabase

### Веб-сервер
- [ ] Создать Nginx конфигурацию
- [ ] Активировать сайт (ln -s)
- [ ] Проверить Nginx конфигурацию (nginx -t)
- [ ] Получить SSL сертификат (certbot)
- [ ] Настроить автообновление SSL
- [ ] Настроить PM2 ecosystem (если нужно)
- [ ] Запустить приложение через PM2 (если нужно)

### Тестирование
- [ ] Проверить все маршруты сайта
- [ ] Протестировать авторизацию
- [ ] Протестировать админ-панель
- [ ] Протестировать школьный портал
- [ ] Проверить Supabase интеграцию
- [ ] Проверить Edge Functions
- [ ] Проверить производительность (PageSpeed)
- [ ] Проверить мобильную версию

### Запуск
- [ ] Переключить DNS на новый сервер
- [ ] Проверить работу сайта по домену
- [ ] Проверить HTTPS
- [ ] Настроить мониторинг (UptimeRobot)
- [ ] Настроить бэкапы базы данных
- [ ] Настроить logrotate
- [ ] Настроить уведомления

### Пост-миграция
- [ ] Удалить сайт с Lovable.app (после проверки)
- [ ] Обновить документацию
- [ ] Обновить README.md
- [ ] Сообщить пользователям о новом домене (если изменился)
- [ ] Настроить редирект со старого домена (если нужно)

---

## 🔐 Безопасность

### Рекомендации по безопасности

1. **SSH**
   - Отключить вход по паролю
   - Использовать только SSH ключи
   - Изменить стандартный порт SSH

2. **Firewall**
   - Открыть только необходимые порты (80, 443, 22)
   - Использовать fail2ban для защиты от брутфорса

3. **Nginx**
   - Настроить security headers
   - Ограничить размер запросов
   - Скрыть версию Nginx

4. **Supabase**
   - Использовать Row Level Security (RLS)
   - Не хранить секретные ключи на клиенте
   - Регулярно обновлять пароли

5. **Приложение**
   - Валидировать все входные данные
   - Использовать HTTPS везде
   - Регулярно обновлять зависимости

### Настройка безопасности SSH

```bash
# Редактировать SSH конфигурацию
sudo nano /etc/ssh/sshd_config

# Изменить следующие параметры:
Port 2222  # Изменить стандартный порт
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Перезапустить SSH
sudo systemctl restart sshd

# Обновить firewall
ufw allow 2222/tcp
ufw delete allow 22/tcp
```

---

## 📚 Полезные ресурсы

### Документация
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

### Инструменты
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Certbot](https://certbot.eff.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)

### Мониторинг
- [UptimeRobot](https://uptimerobot.com/)
- [StatusCake](https://www.statuscake.com/)
- [Pingdom](https://www.pingdom.com/)

---

## 📞 Поддержка

### Контакты для помощи
- Supabase Support: https://supabase.com/support
- Nginx Community: https://forum.nginx.org/
- Node.js Community: https://nodejs.org/en/docs/

### Логи для диагностики
```bash
# Nginx логи
sudo tail -f /var/log/nginx/slp23_access.log
sudo tail -f /var/log/nginx/slp23_error.log

# PM2 логи (если используется)
pm2 logs slp23

# Системные логи
sudo journalctl -u nginx -f
sudo journalctl -u pm2-root -f
```

---

## 🎉 Заключение

После выполнения всех этапов этого плана ваш сайт будет успешно перенесен с Lovable.app на собственный хостинг с полной интеграцией Supabase.

**Ключевые преимущества собственного хостинга:**
- Полный контроль над сервером
- Экономия на хостинге
- Гибкость в настройках
- Возможность масштабирования
- Независимость от сторонних сервисов

**Следующие шаги после миграции:**
1. Регулярные бэкапы
2. Мониторинг производительности
3. Обновление зависимостей
4. Оптимизация скорости
5. Масштабирование при необходимости

---

**Дата создания:** 2026-02-10
**Версия:** 1.0
**Автор:** Migration Plan Generator
