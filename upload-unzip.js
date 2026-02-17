/**
 * 📤 Загрузка _unzip.php на FTP
 */

import ftp from 'basic-ftp';
import dotenv from 'dotenv';
import { join } from 'path';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const CONFIG = {
    ftp: {
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: false
    },
    remotePath: process.env.FTP_REMOTE_PATH
};

async function uploadUnzip() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    
    const unzipPath = join(process.cwd(), '_unzip.php');
    
    if (!fs.existsSync(unzipPath)) {
        console.error("❌ _unzip.php не найден!");
        process.exit(1);
    }
    
    try {
        console.log("🔌 Подключение к FTP...");
        await client.access(CONFIG.ftp);
        console.log("✅ FTP подключён");
        
        const remoteFull = CONFIG.remotePath + '_unzip.php';
        console.log(`📤 Загрузка _unzip.php в ${remoteFull}...`);
        await client.uploadFrom(unzipPath, remoteFull);
        console.log("✅ _unzip.php загружен!");
        
        console.log("\n📝 Теперь откройте в браузере:");
        console.log("   https://slp23.ru/_unzip.php");
        console.log("\n⚠️  После распаковки удалите _unzip.php с сервера!");
        
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

uploadUnzip();
