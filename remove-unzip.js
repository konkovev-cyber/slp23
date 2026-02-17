/**
 * 🗑️  Удаление _unzip.php с сервера
 */

import ftp from 'basic-ftp';
import dotenv from 'dotenv';

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

async function removeUnzip() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    
    try {
        console.log("🔌 Подключение к FTP...");
        await client.access(CONFIG.ftp);
        console.log("✅ FTP подключён");
        
        const remoteFull = CONFIG.remotePath + '_unzip.php';
        console.log(`🗑️  Удаление _unzip.php из ${remoteFull}...`);
        await client.remove(remoteFull);
        console.log("✅ _unzip.php удалён!");
        
        console.log("\n🎉 ДЕПЛОЙ ПОЛНОСТЬЮ ЗАВЕРШЁН!");
        console.log("🌐 Сайт доступен: https://slp23.ru");
        
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

removeUnzip();
