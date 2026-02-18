# 🔑 Настройка SSH для GitHub

## SSH ключ уже создан

**Публичный ключ:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDA0GJtPbobeDR3kyxpYFZP/KlJnUqtLuwDeoqgYJ2mF slp23_project
```

**Fingerprint:** `SHA256:9l5kzFeKN4rHyAdBLhu9Ue4drp0A+s0lx9X7IuSqVUM`

---

## 📋 Шаги по настройке

### 1. Добавьте ключ в GitHub

1. Откройте https://github.com/settings/keys
2. Нажмите **New SSH key**
3. Вставьте публичный ключ из `\_tools\github_ssh_key.pub`
4. Назовите: `slp23_project`
5. Нажмите **Add SSH key**

### 2. Скопируйте ключи в `.ssh` (PowerShell)

```powershell
# Копирование ключей
Copy-Item "d:\1_sites\slp23\_tools\github_ssh_key" "C:\Users\user\.ssh\github_ssh_key"
Copy-Item "d:\1_sites\slp23\_tools\github_ssh_key.pub" "C:\Users\user\.ssh\github_ssh_key.pub"

# Установка правильных прав (для Git Bash)
chmod 600 ~/.ssh/github_ssh_key
chmod 644 ~/.ssh/github_ssh_key.pub
```

### 3. Создайте конфиг SSH

Создайте файл `C:\Users\user\.ssh\config` с содержимым:

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_ssh_key
  IdentitiesOnly yes
```

### 4. Проверьте подключение

```bash
ssh -T git@github.com
```

Ожидаемый ответ:
```
Hi konkovev-cyber! You've successfully authenticated, but GitHub does not provide shell access.
```

### 5. Верните SSH URL для remote

```bash
cd d:\1_sites\slp23
git remote set-url origin git@github.com:konkovev-cyber/slp23.git
git remote -v
```

---

## ✅ Проверка

После настройки:

```bash
git push origin main
```

Должно работать без запроса пароля!

---

## 📝 Файлы

| Файл | Путь |
|------|------|
| Приватный ключ | `_tools\github_ssh_key` |
| Публичный ключ | `_tools\github_ssh_key.pub` |
| SSH конфиг | `C:\Users\user\.ssh\config` |

---

**Создано:** 18 февраля 2026
**Проект:** slp23.ru
**GitHub:** https://github.com/konkovev-cyber/slp23
