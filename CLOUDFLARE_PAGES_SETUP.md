# 🚀 Настройка Cloudflare Pages для Telegram бота

## ШАГ 1: Основные настройки (текущий экран)

На экране "Set up your application" заполните:

✅ **Project name:** `telegram-subscription-bot` (уже заполнено)
✅ **Build command:** оставьте пустым
✅ **Deploy command:** `npx wrangler deploy` (уже заполнено)

## ШАГ 2: Advanced settings (ВАЖНО!)

1. Нажмите **"Advanced settings"** внизу экрана

2. Найдите раздел **"Environment variables"**

3. Добавьте ДВЕ переменные:

### Переменная 1: BOT_TOKEN

```
Variable name: BOT_TOKEN
Value: ваш_токен_от_BotFather
Type: Secret (выберите из выпадающего списка)
```

### Переменная 2: ADMIN_PASSWORD

```
Variable name: ADMIN_PASSWORD
Value: ny9FL5JXopQhRDq2EY4bxXMiHO4/SQCM
Type: Secret (выберите из выпадающего списка)
```

## ШАГ 3: Нажмите Deploy

После добавления переменных нажмите синюю кнопку **"Deploy"** справа внизу.

Cloudflare начнет деплой. Это займет 1-2 минуты.

## ШАГ 4: После деплоя

После успешного деплоя вы получите URL вида:
```
https://telegram-subscription-bot.pages.dev
```

Скопируйте этот URL!

## ШАГ 5: Установите webhook

Откройте в браузере (замените YOUR_BOT_TOKEN и YOUR_WORKER_URL):

```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_WORKER_URL
```

Пример:
```
https://api.telegram.org/bot7234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw/setWebhook?url=https://telegram-subscription-bot.pages.dev
```

Вы должны увидеть:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

## ШАГ 6: Проверьте бота

1. Откройте бота в Telegram
2. Отправьте: `/start`
3. Нажмите кнопку: **✅ Зарегистрироваться**
4. Авторизуйтесь: `/admin ny9FL5JXopQhRDq2EY4bxXMiHO4/SQCM`
5. Должны появиться кнопки управления!

---

## ⚠️ ВАЖНО: Если используете Cloudflare Pages

Cloudflare Pages может не подходить для Workers. Вместо этого используйте **Cloudflare Workers** напрямую:

### Альтернатива: Деплой через командную строку

Это проще и надежнее!

1. Откройте терминал в папке проекта

2. Установите Wrangler (если еще не установлен):
```bash
npm install -g wrangler
```

3. Войдите в Cloudflare:
```bash
wrangler login
```

4. Создайте KV namespace:
```bash
wrangler kv:namespace create "USERS"
```

Скопируйте ID и вставьте в `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "USERS"
id = "ваш_id_здесь"
```

5. Добавьте секреты:
```bash
wrangler secret put BOT_TOKEN
```
Введите токен от BotFather

```bash
wrangler secret put ADMIN_PASSWORD
```
Введите: `ny9FL5JXopQhRDq2EY4bxXMiHO4/SQCM`

6. Деплой:
```bash
wrangler deploy
```

7. Скопируйте URL worker и установите webhook (см. ШАГ 5 выше)

---

## 🎯 Рекомендация

**Используйте командную строку (wrangler)** вместо Cloudflare Pages!

Это проще, быстрее и надежнее для Workers.

Следуйте инструкциям в файле **CLOUDFLARE_DEPLOY.md** или запустите:

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

Скрипт автоматически все настроит!

---

## 📞 Нужна помощь?

Если что-то не работает:

1. Проверьте логи: `wrangler tail`
2. Проверьте webhook: `curl "https://api.telegram.org/botTOKEN/getWebhookInfo"`
3. Убедитесь, что секреты установлены: `wrangler secret list`

Удачи! 🚀
