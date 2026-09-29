require('dotenv').config({ path: '.env.local' });
const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

async function deploy() {
    const zipPath = path.join(__dirname, "deploy.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
        console.log(`📦 Архив создан (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
        const client = new ftp.Client();
        client.ftp.verbose = true;
        try {
            await client.access({
                host: process.env.FTP_HOST,
                user: process.env.FTP_USER,
                password: process.env.FTP_PASSWORD,
                secure: false
            });
            console.log("✅ FTP подключен");
            console.log("📤 Загрузка архива...");
            await client.uploadFrom(zipPath, process.env.FTP_REMOTE_PATH + "deploy.zip");
            console.log("✅ Загрузка завершена");
        } catch (err) {
            console.error("❌ Ошибка деплоя:", err);
        } finally {
            client.close();
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        }
    });

    archive.on("error", (err) => { throw err; });
    archive.pipe(output);

    const distPath = path.join(__dirname, "dist");
    if (!fs.existsSync(distPath)) {
        console.error("❌ Ошибка: Папка 'dist' не найдена. Сначала запустите 'npm run build'");
        process.exit(1);
    }

    archive.directory(distPath, false);
    archive.finalize();
}

deploy();