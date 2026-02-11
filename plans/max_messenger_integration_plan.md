# План внедрения MAX.ru Messenger API

Универсальный план интеграции российского мессенджера MAX.ru для отправки сообщений в любых проектах.

---

## Обзор платформы

**MAX.ru** — российская платформа для создания чат-ботов и мини-приложений, аналог Telegram Bot API.

### Ключевые возможности
- ✅ Отправка текстовых сообщений
- ✅ Отправка медиа (изображения, файлы)
- ✅ Интерактивные клавиатуры (кнопки)
- ✅ Webhook и Long Polling для получения обновлений
- ✅ Форматирование текста (Markdown/HTML)
- ✅ Групповые чаты
- ✅ Мини-приложения (WebApps)

### Ограничения
- **Rate Limit**: 30 запросов в секунду
- **Протокол**: Только HTTPS (HTTP не поддерживается)
- **Токен**: Требуется регистрация бота на платформе MAX для партнёров

---

## Этап 1: Регистрация бота

### 1.1 Создание организации
1. Перейдите на [платформу MAX для партнёров](https://partner.max.ru)
2. Зарегистрируйтесь и создайте организацию
3. Пройдите верификацию (требуется ИНН)

### 1.2 Создание чат-бота
1. В разделе **«Чат-боты»** нажмите **«Создать бота»**
2. Заполните обязательные поля:
   - **Название**: Имя бота (отображается в чатах)
   - **Логотип**: Аватар бота (PNG/JPG, до 5 МБ)
   - **Описание**: Что умеет бот, как с ним работать
3. Дождитесь модерации (обычно 1-3 рабочих дня)

### 1.3 Получение токена
1. После одобрения перейдите в **Интеграция → Получить токен**
2. Скопируйте токен (формат: `AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`)
3. **Важно**: Храните токен в секрете (`.env` файл, переменные окружения)

---

## Этап 2: Базовая настройка

### 2.1 Переменные окружения

Создайте файл `.env`:

```env
MAX_BOT_TOKEN=AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
MAX_API_URL=https://platform-api.max.ru
MAX_WEBHOOK_URL=https://yourdomain.com/webhook/max
```

### 2.2 Установка зависимостей

**Node.js/TypeScript:**
```bash
npm install axios dotenv
# Или официальная библиотека
npm install @max-messenger/max-bot-api-client-ts
```

**Python:**
```bash
pip install requests python-dotenv
```

**Go:**
```bash
go get github.com/max-messenger/max-bot-api-client-go
```

---

## Этап 3: Отправка сообщений

### 3.1 Базовый пример (Node.js)

```typescript
import axios from 'axios';

const MAX_API_URL = process.env.MAX_API_URL;
const BOT_TOKEN = process.env.MAX_BOT_TOKEN;

async function sendMessage(chatId: string, text: string) {
  try {
    const response = await axios.post(
      `${MAX_API_URL}/messages`,
      {
        chat_id: chatId,
        text: text,
      },
      {
        headers: {
          'Authorization': BOT_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Ошибка отправки:', error.response?.data || error.message);
    throw error;
  }
}

// Использование
sendMessage('user_chat_id_123', 'Привет из MAX.ru!');
```

### 3.2 С форматированием (Markdown)

```typescript
async function sendFormattedMessage(chatId: string) {
  return axios.post(
    `${MAX_API_URL}/messages`,
    {
      chat_id: chatId,
      text: '*Жирный текст*\n_Курсив_\n`Код`',
      format: {
        type: 'markdown',
      },
    },
    {
      headers: { 'Authorization': BOT_TOKEN },
    }
  );
}
```

### 3.3 С кнопками (клавиатура)

```typescript
async function sendWithButtons(chatId: string) {
  return axios.post(
    `${MAX_API_URL}/messages`,
    {
      chat_id: chatId,
      text: 'Выберите действие:',
      keyboard: {
        buttons: [
          [
            { text: '✅ Подтвердить', callback_data: 'confirm' },
            { text: '❌ Отменить', callback_data: 'cancel' },
          ],
        ],
      },
    },
    {
      headers: { 'Authorization': BOT_TOKEN },
    }
  );
}
```

### 3.4 Отправка изображения

```typescript
async function sendImage(chatId: string, imageUrl: string, caption?: string) {
  return axios.post(
    `${MAX_API_URL}/messages`,
    {
      chat_id: chatId,
      attachments: [
        {
          type: 'image',
          payload: { url: imageUrl },
        },
      ],
      text: caption || '',
    },
    {
      headers: { 'Authorization': BOT_TOKEN },
    }
  );
}
```

---

## Этап 4: Получение обновлений

### 4.1 Webhook (рекомендуется для production)

#### Настройка webhook

```typescript
async function setupWebhook(webhookUrl: string) {
  return axios.post(
    `${MAX_API_URL}/subscriptions`,
    {
      url: webhookUrl,
      version: '1.0',
    },
    {
      headers: { 'Authorization': BOT_TOKEN },
    }
  );
}

// Вызов при старте приложения
setupWebhook(process.env.MAX_WEBHOOK_URL);
```

#### Обработка входящих сообщений (Express.js)

```typescript
import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhook/max', async (req, res) => {
  const update = req.body;
  
  // Обработка нового сообщения
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    console.log(`Получено сообщение: ${text} от ${chatId}`);
    
    // Ответ пользователю
    await sendMessage(chatId, `Вы написали: ${text}`);
  }
  
  // Обработка нажатия кнопки
  if (update.callback_query) {
    const callbackData = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    
    if (callbackData === 'confirm') {
      await sendMessage(chatId, '✅ Подтверждено!');
    }
  }
  
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Webhook сервер запущен'));
```

### 4.2 Long Polling (для разработки/тестирования)

```typescript
async function getUpdates(offset: number = 0) {
  const response = await axios.get(`${MAX_API_URL}/updates`, {
    headers: { 'Authorization': BOT_TOKEN },
    params: { offset, limit: 100 },
  });
  
  return response.data.updates;
}

// Цикл опроса
async function startPolling() {
  let offset = 0;
  
  while (true) {
    try {
      const updates = await getUpdates(offset);
      
      for (const update of updates) {
        // Обработка обновления
        if (update.message) {
          await sendMessage(update.message.chat.id, 'Получено!');
        }
        
        offset = update.update_id + 1;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Ошибка polling:', error);
    }
  }
}
```

---

## Этап 5: Обработка ошибок

### 5.1 Типичные ошибки

| Код | Описание | Решение |
|-----|----------|---------|
| 401 | Неверный токен | Проверьте `Authorization` заголовок |
| 404 | Чат не найден | Убедитесь, что пользователь начал диалог с ботом |
| 429 | Превышен rate limit | Добавьте задержки между запросами |
| 500 | Ошибка сервера | Повторите запрос через несколько секунд |

### 5.2 Retry-логика

```typescript
async function sendMessageWithRetry(
  chatId: string,
  text: string,
  maxRetries: number = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendMessage(chatId, text);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`Повтор через ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Этап 6: Интеграция в проекты

### 6.1 Уведомления в CRM

```typescript
// Пример: отправка уведомления при новой заявке
async function notifyNewLead(leadData: any) {
  const adminChatId = process.env.ADMIN_CHAT_ID;
  
  const message = `
🆕 *Новая заявка!*

👤 Имя: ${leadData.name}
📧 Email: ${leadData.email}
📞 Телефон: ${leadData.phone}
💬 Сообщение: ${leadData.message}
  `.trim();
  
  await sendFormattedMessage(adminChatId, message);
}
```

### 6.2 Уведомления в электронном дневнике

```typescript
// Пример: уведомление родителя о новой оценке
async function notifyParentAboutGrade(parentChatId: string, grade: any) {
  const emoji = grade.value >= 4 ? '✅' : '⚠️';
  
  const message = `
${emoji} *Новая оценка у ${grade.studentName}*

📚 Предмет: ${grade.subject}
📊 Оценка: ${grade.value}
📅 Дата: ${new Date(grade.date).toLocaleDateString('ru-RU')}
  `.trim();
  
  await sendMessage(parentChatId, message);
}
```

### 6.3 Интеграция с Supabase Edge Functions

```typescript
// supabase/functions/max-notify/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { chatId, message } = await req.json();
  
  const response = await fetch('https://platform-api.max.ru/messages', {
    method: 'POST',
    headers: {
      'Authorization': Deno.env.get('MAX_BOT_TOKEN')!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });
  
  return new Response(JSON.stringify(await response.json()), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Этап 7: Best Practices

### 7.1 Безопасность
- ✅ Храните токен в переменных окружения
- ✅ Используйте HTTPS для webhook
- ✅ Валидируйте входящие данные
- ✅ Ограничьте доступ к webhook endpoint

### 7.2 Производительность
- ✅ Соблюдайте rate limit (30 rps)
- ✅ Используйте очереди для массовых рассылок
- ✅ Кэшируйте chat_id пользователей
- ✅ Логируйте все запросы для отладки

### 7.3 UX
- ✅ Добавляйте эмодзи для визуальной привлекательности
- ✅ Используйте кнопки вместо текстовых команд
- ✅ Форматируйте текст (жирный, курсив)
- ✅ Отправляйте короткие сообщения (до 4096 символов)

---

## Этап 8: Тестирование

### 8.1 Локальное тестирование

```bash
# Запуск ngrok для локального webhook
ngrok http 3000

# Обновление webhook URL
curl -X POST https://platform-api.max.ru/subscriptions \
  -H "Authorization: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok.io/webhook/max"}'
```

### 8.2 Unit-тесты

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MAX.ru Integration', () => {
  it('should send message successfully', async () => {
    const mockAxios = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { message_id: '123' },
    });
    
    await sendMessage('test_chat', 'Hello');
    
    expect(mockAxios).toHaveBeenCalledWith(
      expect.stringContaining('/messages'),
      expect.objectContaining({ text: 'Hello' }),
      expect.any(Object)
    );
  });
});
```

---

## Этап 9: Деплой

### 9.1 Переменные окружения на сервере

```bash
# Vercel
vercel env add MAX_BOT_TOKEN

# Railway
railway variables set MAX_BOT_TOKEN=your_token

# Docker
docker run -e MAX_BOT_TOKEN=your_token myapp
```

### 9.2 Проверка работоспособности

```typescript
// Health check endpoint
app.get('/health/max', async (req, res) => {
  try {
    const response = await axios.get(`${MAX_API_URL}/me`, {
      headers: { 'Authorization': BOT_TOKEN },
    });
    
    res.json({
      status: 'ok',
      bot: response.data,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});
```

---

## Полезные ссылки

- [Официальная документация](https://dev.max.ru/docs)
- [API Reference](https://dev.max.ru/docs-api)
- [TypeScript библиотека](https://github.com/max-messenger/max-bot-api-client-ts)
- [Go библиотека](https://github.com/max-messenger/max-bot-api-client-go)
- [Платформа для партнёров](https://partner.max.ru)

---

## Чеклист внедрения

- [ ] Зарегистрирован бот на платформе MAX для партнёров
- [ ] Получен и сохранён токен в `.env`
- [ ] Реализована функция отправки сообщений
- [ ] Настроен webhook или long polling
- [ ] Добавлена обработка ошибок и retry-логика
- [ ] Протестирована отправка текста, изображений, кнопок
- [ ] Настроены уведомления для вашего use case
- [ ] Развёрнуто на production с HTTPS
- [ ] Добавлен health check endpoint
- [ ] Настроен мониторинг и логирование
