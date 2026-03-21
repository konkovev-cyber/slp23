/**
 * 🚀 FTP Deploy Script для slp23.ru
 *
 * Использование: npm run deploy
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import ftp from 'basic-ftp';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env.local
dotenv.config({ path: '.env.local' });

// Конфигурация из .env.local
const CONFIG = {
    ftp: {
        host: process.env.FTP_HOST || "slp23.ru",
        user: process.env.FTP_USER || "",
        password: process.env.FTP_PASSWORD || "",
        secure: false
    },
    localBuildDir: "dist",
    zipFileName: "deploy.zip",
    remotePath: process.env.FTP_REMOTE_PATH || "/slp23.ru/public_html/"
};

// Проверка наличия учётных данных
console.log("🔍 Проверка конфигурации...");
console.log(`   FTP_HOST: ${CONFIG.ftp.host}`);
console.log(`   FTP_USER: ${CONFIG.ftp.user}`);
console.log(`   FTP_REMOTE_PATH: ${CONFIG.remotePath}`);

if (!CONFIG.ftp.user || !CONFIG.ftp.password) {
    console.error("❌ ОШИБКА: Не настроены FTP учётные данные!");
    console.error("   Проверьте файл .env.local");
    process.exit(1);
}

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    const localPath = join(process.cwd(), CONFIG.localBuildDir);
    const zipPath = join(process.cwd(), CONFIG.zipFileName);

    if (!fs.existsSync(localPath)) {
        console.error(`❌ ОШИБКА: Папка билда не найдена: ${localPath}`);
        process.exit(1);
    }

    try {
        console.log("🔌 Подключение к FTP...");
        await client.access(CONFIG.ftp);
        console.log("✅ FTP подключён");

        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
            console.log("🗑️  Старый архив удалён");
        }

        console.log("📦 Создание ZIP архива...");
        try {
            execSync(`tar -a -c -f "${zipPath}" -C "${localPath}" .`, { stdio: 'pipe' });
        } catch (tarError) {
            console.log("⚠️  tar не доступен, используем archiver...");
            const archiver = (await import('archiver')).default;
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            archive.pipe(output);
            archive.directory(localPath, false);
            await archive.finalize();
            await new Promise((resolve) => output.on('close', resolve));
        }
        console.log("✅ ZIP создан");

        const remoteFull = CONFIG.remotePath + CONFIG.zipFileName;
        console.log(`📤 Загрузка в ${remoteFull}...`);
        await client.uploadFrom(zipPath, remoteFull);
        console.log("✅ Загрузка архива завершена");

        const remoteUnzip = CONFIG.remotePath + "_unzip.php";
        if (fs.existsSync("_unzip.php")) {
            console.log(`📤 Загрузка _unzip.php в ${remoteUnzip}...`);
            await client.uploadFrom("_unzip.php", remoteUnzip);
            console.log("✅ _unzip.php загружен");
        }

        fs.unlinkSync(zipPath);
        console.log("🗑️  Локальный архив удалён");

        console.log("\n✅ ДЕПЛОЙ ЗАВЕРШЁН!");
        console.log("📝 Откройте https://slp23.ru/_unzip.php для распаковки");

    } catch (err) {
        console.error("❌ FTP Error:", err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

deploy();
