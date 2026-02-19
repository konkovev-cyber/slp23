/**
 * Загрузка APK файла на FTP для прямого скачивания
 */

import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

const APK_SOURCE = process.env.APK_PATH || "d:/1_sites/slp23/slp23.apk";

async function uploadApk() {
    const client = new ftp.Client();
    
    try {
        console.log('Подключение к FTP...');
        await client.access({
            host: 'konkevlk.beget.tech',
            user: 'konkevlk_boss',
            password: 'Kk1478963!!!',
            secure: false
        });
        
        console.log('FTP подключён');
        
        // Проверяем наличие APK файла
        if (!fs.existsSync(APK_SOURCE)) {
            console.error(`❌ APK файл не найден: ${APK_SOURCE}`);
            console.log('Укажите путь через переменную окружения APK_PATH');
            return;
        }
        
        const stats = fs.statSync(APK_SOURCE);
        console.log(`📦 APK файл: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Загружаем на FTP
        console.log('📤 Загрузка slp23.apk на сервер...');
        await client.uploadFrom(APK_SOURCE, '/slp23.ru/public_html/slp23.apk');
        
        console.log('✅ APK загружен!');
        console.log('📥 Ссылка для скачивания: https://slp23.ru/slp23.apk');
        
        client.close();
        
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
        client.close();
    }
}

uploadApk();
