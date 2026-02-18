# 🚀 GitHub Release - Автоматическая загрузка

## 🔑 Получение GitHub Token

1. Откройте: https://github.com/settings/tokens/new
2. Выберите **Generate new token (classic)**
3. Заполните:
   - **Note:** `slp23_deploy`
   - **Expiration:** No expiration (или 90 дней)
   - **Scopes:** `repo` (полный доступ к репозиторию)
4. Нажмите **Generate token**
5. **Скопируйте токен** (показывается один раз!)

---

## 📝 Настройка .env.local

Добавьте GitHub токен в `.env.local`:

```env
# GitHub Release
GITHUB_TOKEN=ghp_ваш_токен_здесь
GITHUB_REPO=konkovev-cyber/slp23
```

---

## 🎯 Создание релиза (автоматически)

### Шаг 1: Проверка авторизации

```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

**Ожидаемый ответ:**
```json
{
  "login": "konkovev-cyber",
  "id": 12345678,
  ...
}
```

---

### Шаг 2: Создание релиза

```bash
# Версия и название
VERSION="v1.0.1"
TITLE="APK с дневником"
NOTES="## ✨ Особенности версии $VERSION

- 📱 APK открывается сразу на форме входа
- 🔧 Исправлена кнопка 'На главную'
- 🌐 Разделение веб/APK версий
- 🗑️ Удалена ссылка 'Условия' из футера

## 📦 Установка

1. Скачайте APK файл
2. Разрешите установку из неизвестных источников
3. Установите как обычное приложение"

# Создание релиза через API
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/konkovev-cyber/slp23/releases \
  -d "{
    \"tag_name\": \"$VERSION\",
    \"name\": \"$TITLE\",
    \"body\": \"$NOTES\",
    \"draft\": false,
    \"prerelease\": false
  }"
```

**Ответ:**
```json
{
  "id": 123456789,
  "upload_url": "https://uploads.github.com/repos/konkovev-cyber/slp23/releases/123456789/assets{?name,label}",
  "html_url": "https://github.com/konkovev-cyber/slp23/releases/tag/v1.0.1"
}
```

---

### Шаг 3: Загрузка APK файла

```bash
# Извлеките upload_url из ответа (без {?name,label})
UPLOAD_URL="https://uploads.github.com/repos/konkovev-cyber/slp23/releases/123456789/assets"

# Загрузка APK
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@slp23.apk" \
  "$UPLOAD_URL?name=slp23.apk"
```

**Ответ:**
```json
{
  "name": "slp23.apk",
  "size": 35401423,
  "browser_download_url": "https://github.com/konkovev-cyber/slp23/releases/download/v1.0.1/slp23.apk"
}
```

---

## 🤖 Автоматический скрипт

Создайте файл `github-release.js`:

```javascript
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO || 'konkovev-cyber/slp23';
const APK_FILE = 'slp23.apk';
const VERSION = 'v1.0.1';
const TITLE = 'APK с дневником';

async function createRelease() {
  const notes = `## ✨ Особенности версии ${VERSION}

- 📱 APK открывается сразу на форме входа
- 🔧 Исправлена кнопка 'На главную'
- 🌐 Разделение веб/APK версий

## 📦 Установка
1. Скачайте APK файл
2. Разрешите установку из неизвестных источников
3. Установите как обычное приложение`;

  // 1. Создание релиза
  console.log('📝 Создание релиза...');
  const releaseResponse = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tag_name: VERSION,
      name: TITLE,
      body: notes,
      draft: false,
      prerelease: false
    })
  });

  const release = await releaseResponse.json();
  console.log(`✅ Релиз создан: ${release.html_url}`);

  // 2. Загрузка APK
  console.log('📤 Загрузка APK...');
  const apkData = fs.readFileSync(APK_FILE);
  const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${APK_FILE}`);
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/octet-stream'
    },
    body: apkData
  });

  const upload = await uploadResponse.json();
  console.log(`✅ APK загружен: ${upload.browser_download_url}`);

  console.log('\n🎉 Релиз готов!');
  console.log(`🌐 ${release.html_url}`);
}

createRelease().catch(console.error);
```

---

## 📋 Ручное создание (через веб)

Если не хотите использовать API:

### Шаг 1: Откройте страницу релиза

```
https://github.com/konkovev-cyber/slp23/releases/new
```

### Шаг 2: Заполните поля

| Поле | Значение |
|------|----------|
| **Tag version** | `v1.0.1` |
| **Release title** | `APK с дневником` |
| **Description** | (см. ниже) |

### Шаг 3: Описание релиза

```markdown
## ✨ Особенности версии 1.0.1

- 📱 APK открывается сразу на форме входа в дневник
- 🔧 Исправлена кнопка "На главную" 
- 🌐 Разделение веб/APK версий
- 🗑️ Удалена ссылка "Условия" из футера

## 📦 Установка

1. Скачайте APK файл ниже
2. Разрешите установку из неизвестных источников
3. Установите как обычное приложение

## 🔗 Ссылки

- Сайт: https://slp23.ru
- Документация: https://github.com/konkovev-cyber/slp23/blob/main/APK_DIARY_GUIDE.md
```

### Шаг 4: Прикрепите APK

1. Перетащите файл `d:\1_sites\slp23\slp23.apk` (35.4 MB) в область **"Attach binaries"**
2. Дождитесь загрузки (может занять 1-2 минуты)

### Шаг 5: Публикация

Нажмите **Publish release** (зелёная кнопка внизу)

---

## ✅ Проверка

После создания релиза:

1. **Откройте:** https://github.com/konkovev-cyber/slp23/releases/latest
2. **Проверьте:** APK файл прикреплён к релизу
3. **Скачайте:** Нажмите на `slp23.apk` для загрузки

---

## 🔗 Прямая ссылка на APK

После релиза APK будет доступен по ссылке:

```
https://github.com/konkovev-cyber/slp23/releases/download/v1.0.1/slp23.apk
```

Эту ссылку можно использовать в футере сайта!

---

## 🛠️ Решение проблем

### Ошибка: "Bad credentials"

**Проблема:** Неправильный токен

**Решение:**
1. Проверьте токен в `.env.local`
2. Создайте новый токен: https://github.com/settings/tokens
3. Убедитесь, что у токена есть scope `repo`

---

### Ошибка: "Validation failed: tag_name already exists"

**Проблема:** Релиз с таким тегом уже существует

**Решение:**
1. Увеличьте версию: `v1.0.2` вместо `v1.0.1`
2. Или удалите существующий релиз на GitHub

---

### Ошибка: "Release not found"

**Проблема:** Релиз ещё не создан

**Решение:** Сначала создайте релиз (Шаг 2), затем загружайте APK (Шаг 3)

---

## 📊 Сравнение с FTP деплоем

| Шаг | FTP Деплой | GitHub Release |
|-----|------------|----------------|
| 1 | `npm run build` | `npm run build` (если нужно) |
| 2 | `node ftp-deploy.js` | Создать релиз на GitHub |
| 3 | `node upload-unzip.js` | Прикрепить APK |
| 4 | Открыть `_unzip.php` | Нажать "Publish release" |
| 5 | `node remove-unzip.js` | ✅ Готово! |

---

**Создано:** 19 февраля 2026  
**Проект:** slp23.ru  
**GitHub:** https://github.com/konkovev-cyber/slp23
