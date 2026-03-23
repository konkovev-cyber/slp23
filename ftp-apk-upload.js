/**
 * 📱 APK Upload Script для slp23.ru
 */

import ftp from 'basic-ftp';
import dotenv from 'dotenv';
import { join } from 'path';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const CONFIG = {
    ftp: {
        host: process.env.FTP_HOST || "slp23.ru",
        user: process.env.FTP_USER || "",
        password: process.env.FTP_PASSWORD || "",
        secure: false
    },
    localApkPath: "android/app/build/outputs/apk/debug/app-debug.apk",
    remoteApkPath: (process.env.FTP_REMOTE_PATH || "/slp23.ru/public_html/") + "slp23.apk"
};

async function uploadApk() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log("🔌 Подключение к FTP...");
        await client.access(CONFIG.ftp);
        console.log("✅ FTP подключён");

        const localFile = join(process.cwd(), CONFIG.localApkPath);
        if (!fs.existsSync(localFile)) {
            throw new Error(`APK file not found at ${localFile}. Did you run build?`);
        }

        console.log(`📤 Загрузка APK в ${CONFIG.remoteApkPath}...`);
        await client.uploadFrom(localFile, CONFIG.remoteApkPath);
        console.log("✅ Загрузка APK завершена!");
        console.log(`🔗 Ссылка для скачивания: https://slp23.ru/slp23.apk`);

    } catch (err) {
        console.error("❌ FTP Error:", err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

uploadApk();
