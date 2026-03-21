import ftp from 'basic-ftp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function check() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: process.env.FTP_HOST || "slp23.ru",
            user: process.env.FTP_USER || "",
            password: process.env.FTP_PASSWORD || "",
            secure: false
        });
        console.log("Connected");
        const list = await client.list("/slp23.ru/public_html/");
        console.log("Files in /slp23.ru/public_html/:");
        list.forEach(f => console.log(`- ${f.name} (${f.size} bytes)`));
    } catch (err) {
        console.error(err);
    } finally {
        client.close();
    }
}
check();
