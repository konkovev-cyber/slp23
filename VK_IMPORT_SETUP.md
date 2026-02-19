# 🚀 Деплой функции VK Import

## 📦 Обновлённая функция fetch-metadata

**Файл:** `supabase/functions/fetch-metadata/index.ts`

**Что добавлено:**
- ✅ Поддержка VK API через Service Key
- ✅ Извлечение постов из VK (wall-XXXXX_YYYY)
- ✅ Автоматическое получение изображений и видео из поста
- ✅ Правильная кодировка текста

---

## 🔑 Ключи VK API

**Сервисный ключ:** `bc15f23abc15f23abc15f23a7dbf2b05adbbc15bc15f23ad58326cf040249df893a4523`

**Защищённый ключ:** `FaYx6PMdo2ceIPi4Tj91`

**Версия API:** `2024.01.01`

---

## 📝 Инструкция по деплою

### Шаг 1: Откройте Supabase Dashboard

https://supabase.com/dashboard/project/qwuicyhadpesklhkjxpn/functions

### Шаг 2: Выберите функцию `fetch-metadata`

Нажмите на функцию в списке

### Шаг 3: Замените код

1. Откройте вкладку **Code**
2. **Полностью удалите** старый код
3. **Вставьте** новый код из файла `supabase/functions/fetch-metadata/index.ts`
4. Нажмите **Deploy**

### Шаг 4: Проверьте логи

После деплоя откройте **Logs** и протестируйте функцию

---

## 🧪 Тестирование

### Тест 1: VK пост (через API)

```bash
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://vk.com/wall-226860244_207\"}"
```

**Ожидаемый ответ:**
```json
{
  "title": "Заголовок поста",
  "description": "Краткое описание...",
  "content": "Полный текст поста...",
  "image": "https://sun9-74.userapi.com/...",
  "mediaList": [
    {"url": "https://...", "type": "image"},
    {"url": "https://...", "type": "video"}
  ],
  "source": "vk"
}
```

### Тест 2: Telegram (через HTML)

```bash
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://t.me/lichnost_PLUS/449\"}"
```

### Тест 3: YouTube

```bash
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"
```

---

## 🔧 Логи для отладки

В логах ищите сообщения:

```
DEBUG: VK URL detected: https://vk.com/wall-226860244_207
DEBUG: VK URL parsed - owner: -226860244 post: 207
DEBUG: VK API response: {...}
DEBUG: VK data fetched successfully
```

Если ошибка:
```
DEBUG: VK API error: {...}
DEBUG: VK API failed, falling back to HTML parsing
```

---

## 📊 Пример ответа VK API

```json
{
  "response": {
    "items": [{
      "id": 207,
      "owner_id": -226860244,
      "text": "Текст поста...",
      "attachments": [
        {
          "type": "photo",
          "photo": {
            "sizes": [
              {"type": "z", "url": "https://sun9-74.userapi.com/..."},
              {"type": "y", "url": "https://sun9-74.userapi.com/..."}
            ],
            "photo_604": "https://...",
            "photo_807": "https://...",
            "photo_1280": "https://..."
          }
        }
      ]
    }]
  }
}
```

---

## ✅ Чек-лист

- [ ] Код скопирован в Supabase Dashboard
- [ ] Функция задеплоена
- [ ] Тест VK прошёл успешно
- [ ] Тест Telegram прошёл успешно
- [ ] Логи проверяются

---

**Создано:** 19 февраля 2026  
**Статус:** ⏳ Ожидает деплоя
