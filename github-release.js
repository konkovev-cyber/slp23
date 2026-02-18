/**
 * 🚀 GitHub Release Creator
 * Автоматическое создание релиза с APK
 *
 * Использование: node github-release.js
 */

import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO || 'konkovev-cyber/slp23';
const APK_FILE = 'slp23.apk';
const VERSION = 'v1.0.1';
const TITLE = 'APK с дневником';

if (!TOKEN) {
  console.error('❌ Ошибка: GITHUB_TOKEN не найден в .env.local');
  console.error('📝 Добавьте токен: GITHUB_TOKEN=ghp_...');
  console.error('🔗 Создать токен: https://github.com/settings/tokens/new');
  process.exit(1);
}

if (!fs.existsSync(APK_FILE)) {
  console.error(`❌ Ошибка: APK файл не найден: ${APK_FILE}`);
  console.error('📦 Соберите APK: npm run build && npx cap sync android && cd android && .\\gradlew assembleDebug');
  process.exit(1);
}

async function createRelease() {
  const notes = `## ✨ Особенности версии ${VERSION}

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
`;

  try {
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

    if (!releaseResponse.ok) {
      const error = await releaseResponse.json();
      if (error.message.includes('tag_name already exists')) {
        console.error('❌ Ошибка: Релиз с таким тегом уже существует');
        console.error('💡 Измените версию в github-release.js (например, v1.0.2)');
      } else {
        console.error('❌ Ошибка создания релиза:', error.message);
      }
      process.exit(1);
    }

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

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('❌ Ошибка загрузки APK:', error.message);
      process.exit(1);
    }

    const upload = await uploadResponse.json();
    console.log(`✅ APK загружен: ${upload.browser_download_url}`);

    console.log('\n🎉 Релиз готов!');
    console.log(`🌐 ${release.html_url}`);
    console.log(`📦 ${upload.browser_download_url}`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

createRelease();
