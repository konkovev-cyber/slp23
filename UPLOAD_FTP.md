# 📤 Загрузка на FTP

## Файлы для загрузки:

### 1. Основной файл функции:
- **Источник:** `supabase/functions/fetch-metadata/index_vk_api.ts`
- **Назначение:** `supabase/functions/fetch-metadata/index.ts`

### 2. Документация:
- `docs/FETCH_METADATA.md`
- `docs/IMPORT_TEST_REPORT.md`
- `docs/NEWS_IMPORT_GUIDE_USER.md`
- `FIX_NEWS_IMPORT.md`

---

## Инструкция:

### Шаг 1: Скопируйте файл функции

```bash
# Windows PowerShell
Copy-Item -Path "supabase/functions/fetch-metadata/index_vk_api.ts" `
          -Destination "supabase/functions/fetch-metadata/index.ts" `
          -Force
```

### Шаг 2: Загрузите на FTP

**FTP доступ к slp23.ru:**
- **Хост:** slp23.ru (или IP сервера)
- **Логин:** (нужен у администратора)
- **Пароль:** (нужен у администратора)
- **Путь:** `/public_html/` или `/www/`

**Используйте FTP клиент:**
- FileZilla
- WinSCP
- Cyberduck

**Загрузите файлы:**
```
supabase/functions/fetch-metadata/index.ts  →  /supabase/functions/fetch-metadata/index.ts
docs/FETCH_METADATA.md  →  /docs/FETCH_METADATA.md
docs/IMPORT_TEST_REPORT.md  →  /docs/IMPORT_TEST_REPORT.md
docs/NEWS_IMPORT_GUIDE_USER.md  →  /docs/NEWS_IMPORT_GUIDE_USER.md
```

---

## Альтернатива: через PowerShell с FTP

```powershell
# Создайте файл upload.ps1 и запустите его

$ftpServer = "ftp://slp23.ru"
$ftpUser = "ваш_логин"
$ftpPass = "ваш_пароль"

$files = @(
    "supabase\functions\fetch-metadata\index_vk_api.ts",
    "docs\FETCH_METADATA.md",
    "docs\IMPORT_TEST_REPORT.md",
    "docs\NEWS_IMPORT_GUIDE_USER.md"
)

foreach ($file in $files) {
    $ftpUri = "$ftpServer/$file"
    $request = [System.Net.FtpWebRequest]::Create($ftpUri)
    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.UseBinary = $true
    $request.UsePassive = $true
    
    $fileContent = [System.IO.File]::ReadAllBytes($file)
    $request.ContentLength = $fileContent.Length
    
    $requestStream = $request.GetRequestStream()
    $requestStream.Write($fileContent, 0, $fileContent.Length)
    $requestStream.Close()
    
    $response = $request.GetResponse()
    Write-Host "Uploaded: $file - $($response.StatusDescription)"
    $response.Close()
}
```

---

## Проверка:

После загрузки проверьте:
1. Файл `index.ts` на сервере совпадает с `index_vk_api.ts`
2. Документы доступны по ссылкам:
   - https://slp23.ru/docs/FETCH_METADATA.md
   - https://slp23.ru/docs/IMPORT_TEST_REPORT.md
   - https://slp23.ru/docs/NEWS_IMPORT_GUIDE_USER.md

---

## Примечание:

**Важно:** Edge Function `fetch-metadata` деплоится через **Supabase Dashboard**, а не через FTP!

FTP используется только для:
- Документации
- Статических файлов
- Резервных копий

Для обновления функции используйте:
1. Supabase Dashboard → Edge Functions → fetch-metadata
2. Вставьте код из `index_vk_api.ts`
3. Нажмите Deploy
