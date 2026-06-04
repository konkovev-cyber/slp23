<?php
$file = 'deploy.zip';
set_time_limit(600);
if (!file_exists($file)) {
    die("❌ Ошибка: Файл $file не найден. Проверьте загрузку.");
}
$zip = new ZipArchive;
if ($zip->open($file) === TRUE) {
    echo "📦 Распаковка $file...<br>";
    $zip->extractTo(__DIR__);
    $zip->close();
    unlink($file);
    echo "✅ Распаковка успешна!<br>";
    echo "🗑️ Архив удалён.<br><br>";
    echo "<b>🚀 ДЕПЛОЙ ЗАВЕРШЁН!</b><br>";
} else {
    echo "❌ Ошибка: Не удалось открыть zip-архив.";
}