import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import ftp from 'basic-ftp';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.local' });

const CONFIG = {
    ftp: {
        host: process.env.FTP_HOST || "slp23.ru",
        user: process.env.FTP_USER || "",
        password: process.env.FTP_PASSWORD || "",
        secure: false
    },
    remotePath: process.env.FTP_REMOTE_PATH || "/slp23.ru/public_html/"
};

async function uploadUnzip() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log("🔌 Подключение к FTP...");
        await client.access(CONFIG.ftp);
        console.log("✅ FTP подключён");

        const localFile = join(process.cwd(), "_unzip.php");
        const remoteFile = CONFIG.remotePath + "_unzip.php";

        console.log(`📤 Загрузка ${localFile} в ${remoteFile}...`);
        await client.uploadFrom(localFile, remoteFile);
        console.log("✅ Загрузка завершена");

    } catch (err) {
        console.error("❌ FTP Error:", err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

uploadUnzip();
