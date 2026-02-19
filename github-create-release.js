/**
 * Создание релиза на GitHub с загрузкой APK
 * 
 * Использование:
 * 1. Создайте Personal Access Token: https://github.com/settings/tokens
 * 2. Задайте переменную окружения: GITHUB_TOKEN=your_token
 * 3. Запустите: node github-create-release.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'konkovev-cyber/slp23';
const APK_PATH = './slp23.apk';
const VERSION = 'v1.0.1';

if (!GITHUB_TOKEN) {
    console.error('❌ ОШИБКА: Не задан GITHUB_TOKEN');
    console.log('Создайте токен: https://github.com/settings/tokens');
    console.log('Добавьте в .env.local: GITHUB_TOKEN=your_token');
    process.exit(1);
}

if (!fs.existsSync(APK_PATH)) {
    console.error('❌ ОШИБКА: APK файл не найден:', APK_PATH);
    process.exit(1);
}

const apkStats = fs.statSync(APK_PATH);
console.log('📦 APK файл:', (apkStats.size / 1024 / 1024).toFixed(2), 'MB');

// Создаём релиз через GitHub CLI
console.log('📝 Создание релиза', VERSION, '...');

try {
    execSync(
        `gh release create ${VERSION} ${APK_PATH} ` +
        `--repo ${REPO} ` +
        `--title "${VERSION} - Мобильное приложение" ` +
        `--notes "${createReleaseNotes()}" ` +
        `--generate-notes`,
        {
            stdio: 'inherit',
            env: { ...process.env, GH_TOKEN: GITHUB_TOKEN }
        }
    );
    console.log('✅ Релиз создан!');
    console.log('📥 Ссылка: https://github.com/' + REPO + '/releases/tag/' + VERSION);
} catch (error) {
    console.error('❌ Ошибка создания релиза:', error.message);
    console.log('\n💡 Попробуйте вручную: https://github.com/' + REPO + '/releases/new');
}

function createReleaseNotes() {
    return `## 📱 Мобильное приложение "Личность ПЛЮС"

Первая версия мобильного приложения для школьного портала.

### ✨ Особенности:
- Электронный дневник
- Оценки и расписание
- Домашние задания
- Профиль студента/учителя/родителя
- Вход через email/пароль

### 📦 Установка:
1. Скачайте APK файл
2. Разрешите установку из неизвестных источников (Настройки → Безопасность)
3. Установите как обычное приложение
4. Войдите через email/пароль

### 🔧 Технические детали:
- **Версия:** ${VERSION}
- **Дата:** ${new Date().toISOString().split('T')[0]}
- **Package:** ru.slp23.app
- **Размер:** ${(apkStats.size / 1024 / 1024).toFixed(2)} MB
- **Android:** 5.0+

---
**Сайт:** https://slp23.ru  
**Поддержка:** support@slp23.ru`;
}
