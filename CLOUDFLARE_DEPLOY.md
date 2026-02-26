# 🚀 Деплой Telegram бота на Cloudflare Workers

## Шаг 1: Подготовка

1. Установите Node.js (если еще не установлен): https://nodejs.org/
2. Установите Wrangler CLI:
```bash
npm install -g wrangler
```

3. Войдите в Cloudflare:
```bash
wrangler login
```

## Шаг 2: Создайте KV namespace

KV namespace нужен для хранения данных пользователей и админов.

```bash
wrangler kv:namespace create "USERS"
```

Скопируйте ID, который вернет команда, и вставьте в `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "USERS"
id = "ваш_id_здесь"
```

## Шаг 3: Настройте секреты

Добавьте токен бота:
```bash
wrangler secret put BOT_TOKEN
```
Введите токен от @BotFather

Добавьте пароль админа:
```bash
wrangler secret put ADMIN_PASSWORD
```
Введите свой собственный надежный пароль (минимум 16 символов)

## Шаг 4: Деплой

```bash
wrangler deploy
```

После деплоя вы получите URL вида: `https://telegram-bot.ваш-username.workers.dev`

## Шаг 5: Настройте webhook

Установите webhook для бота (замените YOUR_BOT_TOKEN и YOUR_WORKER_URL):

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_WORKER_URL"}'
```

Или через браузер:
```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_WORKER_URL
```

## Шаг 6: Проверьте webhook

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## ✅ Готово!

Ваш бот теперь работает на Cloudflare Workers 24/7 бесплатно!

---

## 📋 Команды бота

### Для пользователей:
- `/start` - Регистрация
- `/help` - Помощь

### Для админов:
После авторизации (`/admin пароль`) появятся кнопки:
- 👥 Список пользователей
- 📢 Рассылка всем
- ✉️ Отправить конкретному

---

## 🔧 Обновление бота

После изменения кода:
```bash
wrangler deploy
```

Webhook обновлять не нужно!

---

## 📊 Мониторинг

Просмотр логов:
```bash
wrangler tail
```

Статистика в Cloudflare Dashboard:
https://dash.cloudflare.com → Workers & Pages → ваш worker

---

## 💡 Преимущества Cloudflare Workers

- ✅ Бесплатно до 100,000 запросов в день
- ✅ Работает 24/7 без засыпания
- ✅ Быстрый отклик (edge computing)
- ✅ Автоматическое масштабирование
- ✅ Встроенное хранилище (KV)

---

## ⚠️ Важно

- Пароль админа: установите свой собственный через `wrangler secret put ADMIN_PASSWORD`
- Данные хранятся в Cloudflare KV (постоянно)
- Бесплатный лимит KV: 100,000 операций чтения/день, 1,000 записей/день
- Для большой нагрузки используйте платный план

---

## 🐛 Решение проблем

**Бот не отвечает:**
1. Проверьте webhook: `curl "https://api.telegram.org/botTOKEN/getWebhookInfo"`
2. Проверьте логи: `wrangler tail`
3. Убедитесь, что секреты установлены: `wrangler secret list`

**Ошибка KV:**
1. Проверьте, что KV namespace создан
2. Проверьте ID в `wrangler.toml`

**Webhook не устанавливается:**
1. Убедитесь, что URL начинается с `https://`
2. Проверьте, что worker задеплоен
