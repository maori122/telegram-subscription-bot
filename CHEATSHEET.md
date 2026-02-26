# 📝 Шпаргалка по командам

## Установка и настройка

```bash
# Установка Wrangler
npm install -g wrangler

# Логин в Cloudflare
wrangler login

# Создание KV namespace
wrangler kv:namespace create "USERS"

# Добавление секретов
wrangler secret put BOT_TOKEN
wrangler secret put ADMIN_PASSWORD

# Деплой
wrangler deploy
```

## Управление

```bash
# Локальная разработка
wrangler dev

# Просмотр логов
wrangler tail

# Обновление после изменений
wrangler deploy

# Список секретов
wrangler secret list

# Удаление секрета
wrangler secret delete SECRET_NAME
```

## Webhook

```bash
# Установка webhook
curl "https://api.telegram.org/botTOKEN/setWebhook?url=WORKER_URL"

# Проверка webhook
curl "https://api.telegram.org/botTOKEN/getWebhookInfo"

# Удаление webhook
curl "https://api.telegram.org/botTOKEN/deleteWebhook"
```

## Git

```bash
# Инициализация
git init
git add .
git commit -m "Initial commit"

# Загрузка на GitHub
git remote add origin https://github.com/username/repo.git
git branch -M main
git push -u origin main

# Обновление
git add .
git commit -m "Update"
git push
```

## Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Регистрация |
| `/admin пароль` | Авторизация админа |
| `/help` | Справка |

## Пароль админа

```
Yp~?L*W<a"v/(~mFm&[&
```

## Структура кнопок

```
Панель администратора
├── 👥 Список пользователей
├── 📢 Рассылка всем
└── ✉️ Отправить конкретному
    ├── Пользователь 1
    ├── Пользователь 2
    └── 🔙 Назад
```

## Полезные ссылки

- Cloudflare Dashboard: https://dash.cloudflare.com
- Telegram Bot API: https://core.telegram.org/bots/api
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/

## Решение проблем

```bash
# Бот не отвечает
wrangler tail  # Смотрим логи
curl "https://api.telegram.org/botTOKEN/getWebhookInfo"  # Проверяем webhook

# Ошибка KV
# Проверьте ID в wrangler.toml

# Ошибка секретов
wrangler secret list  # Проверяем наличие
wrangler secret put SECRET_NAME  # Добавляем заново
```

## Лимиты бесплатного плана

- 100,000 запросов/день
- 100,000 чтений KV/день
- 1,000 записей KV/день
- 1 GB хранилища KV

Этого достаточно для большинства ботов!
