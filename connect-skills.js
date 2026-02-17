#!/usr/bin/env node

/**
 * 🔌 Скрипт подключения скилов для проекта slp23.ru
 */

import { mkdirSync, existsSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Абсолютные пути
const PROJECT_ROOT = 'd:/1_sites/slp23';
const SKILLS_SOURCE = 'd:/1_sites/slp23/_tools/skills';
const SKILLS_TARGET = 'd:/1_sites/slp23/.agent/skills';

// Рекомендуемые скилы для slp23.ru
const RECOMMENDED_SKILLS = [
    // === ESSENTIALS (Базовые) ===
    'concise-planning',
    'git-pushing',
    'systematic-debugging',
    'lint-and-validate',
    'kaizen',
    
    // === WEB DEVELOPMENT ===
    'react-best-practices',
    'typescript-expert',
    'frontend-dev-guidelines',
    'tailwind-patterns',
    'react-patterns',
    
    // === BACKEND & API ===
    'api-patterns',
    'api-security-best-practices',
    'backend-dev-guidelines',
    
    // === SECURITY ===
    'frontend-security-coder',
    'backend-security-coder',
    'security-auditor',
    
    // === TESTING ===
    'test-driven-development',
    'testing-patterns',
    'playwright-skill',
    
    // === PERFORMANCE ===
    'web-performance-optimization',
    'application-performance-performance-optimization',
    
    // === MOBILE (Capacitor) ===
    'mobile-developer',
    
    // === DEVOPS ===
    'deployment-engineer',
    'github-actions-templates',
    'docker-expert',
    
    // === AI & AUTOMATION ===
    'prompt-engineer',
    'workflow-automation',
];

console.log('🔌 Подключение скилов для slp23.ru...\n');
console.log(`📂 Источник: ${SKILLS_SOURCE}`);
console.log(`📂 Цель: ${SKILLS_TARGET}\n`);

// Проверка источника
if (!existsSync(SKILLS_SOURCE)) {
    console.error(`❌ Папка со скилами не найдена: ${SKILLS_SOURCE}`);
    process.exit(1);
}

// Создание целевой папки
if (!existsSync(SKILLS_TARGET)) {
    mkdirSync(SKILLS_TARGET, { recursive: true });
    console.log('✅ Создана папка .agent/skills\n');
}

// Подключение скилов
let successCount = 0;
let missingCount = 0;

console.log('📦 Подключение скилов:\n');

function copyFolderRecursive(source, target) {
    if (!existsSync(target)) {
        mkdirSync(target, { recursive: true });
    }
    
    const entries = readdirSync(source, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = join(source, entry.name);
        const dstPath = join(target, entry.name);
        
        if (entry.isDirectory()) {
            copyFolderRecursive(srcPath, dstPath);
        } else {
            copyFileSync(srcPath, dstPath);
        }
    }
}

for (const skill of RECOMMENDED_SKILLS) {
    const sourcePath = join(SKILLS_SOURCE, skill);
    const targetPath = join(SKILLS_TARGET, skill);
    
    if (!existsSync(sourcePath)) {
        console.log(`  ⚠️  ${skill} - не найден`);
        missingCount++;
        continue;
    }
    
    if (existsSync(targetPath)) {
        console.log(`  ✓  ${skill} - уже подключён`);
        successCount++;
        continue;
    }
    
    try {
        copyFolderRecursive(sourcePath, targetPath);
        console.log(`  ✅ ${skill} - подключён`);
        successCount++;
    } catch (err) {
        console.log(`  ❌ ${skill} - ошибка: ${err.message}`);
    }
}

// Итоги
console.log('\n' + '='.repeat(50));
console.log('📊 ИТОГИ:');
console.log(`  ✅ Подключено: ${successCount}`);
console.log(`  ⚠️  Не найдено: ${missingCount}`);
console.log('='.repeat(50));

// Создание CLAUDE.md
const claudeMdPath = join(PROJECT_ROOT, 'CLAUDE.md');
const claudeMdContent = `# 🤖 AI Assistant Configuration for slp23.ru

## 📦 Installed Skills

Skills are located in: \`.agent/skills/\`

### Quick Start
- @concise-planning - Планирование задач
- @git-pushing - Коммит и пуш
- @systematic-debugging - Отладка
- @react-best-practices - React паттерны
- @typescript-expert - TypeScript

### Development
- @frontend-dev-guidelines
- @backend-dev-guidelines
- @api-patterns
- @test-driven-development

### Security
- @security-auditor
- @frontend-security-coder
- @backend-security-coder

### DevOps
- @deployment-engineer
- @github-actions-templates
- @docker-expert

## 🚀 Commands

\`\`\`bash
# Build
npm run build

# Deploy
npm run deploy

# Android APK
npx cap sync android
cd android && .\\gradlew assembleDebug
\`\`\`

## 🔗 Links
- GitHub: https://github.com/konkovev-cyber/slp23
- Site: https://slp23.ru
`;

writeFileSync(claudeMdPath, claudeMdContent);
console.log('\n✅ Создан CLAUDE.md\n');

console.log('✨ Готово!\n');
