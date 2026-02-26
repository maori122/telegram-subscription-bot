# Инструкция по деплою бота

## Вариант 1: Railway.app (РЕКОМЕНДУЕТСЯ - бесплатно и просто)

1. Зарегистрируйтесь на https://railway.app
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Подключите свой GitHub аккаунт и выберите репозиторий с ботом
4. После создания проекта, перейдите в Settings → Variables
5. Добавьте переменные окружения:
   - `BOT_TOKEN` = ваш токен от BotFather
   - `ADMIN_PASSWORD_HASH` = $2b$12$VXMamfd.bj8OUIPzj65ZV.kJMs/r.VDcqOG08GNjk8AafXOVGkepS
6. Бот автоматически запустится!

Пароль для админа: `Yp~?L*W<a"v/(~mFm&[&`

## Вариант 2: Render.com (бесплатно)

1. Зарегистрируйтесь на https://render.com
2. Нажмите "New" → "Background Worker"
3. Подключите GitHub репозиторий
4. Настройки:
   - Name: telegram-bot
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python bot.py`
5. Добавьте Environment Variables:
   - `BOT_TOKEN` = ваш токен
   - `ADMIN_PASSWORD_HASH` = $2b$12$VXMamfd.bj8OUIPzj65ZV.kJMs/r.VDcqOG08GNjk8AafXOVGkepS
6. Нажмите "Create Background Worker"

## Вариант 3: Fly.io (бесплатно)

1. Установите Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Зарегистрируйтесь: `fly auth signup`
3. В папке с ботом выполните:
```bash
fly launch
fly secrets set BOT_TOKEN="ваш_токен"
fly secrets set ADMIN_PASSWORD_HASH='$2b$12$VXMamfd.bj8OUIPzj65ZV.kJMs/r.VDcqOG08GNjk8AafXOVGkepS'
fly deploy
```

## Вариант 4: VPS (любой хостинг)

1. Подключитесь к серверу по SSH
2. Установите Python 3.11+
3. Загрузите файлы бота на сервер
4. Установите зависимости: `pip install -r requirements.txt`
5. Создайте `.env` файл с токеном и хешем пароля
6. Запустите бота в фоне:
```bash
nohup python bot.py &
```

Или используйте systemd для автозапуска.

## Важно!

- Файлы `users.json` и `admins.json` будут создаваться автоматически
- На бесплатных хостингах эти файлы могут удаляться при перезапуске
- Для постоянного хранения данных используйте базу данных (PostgreSQL, MongoDB)

## Проверка работы

После деплоя:
1. Найдите бота в Telegram
2. Отправьте `/start`
3. Авторизуйтесь как админ: `/admin Yp~?L*W<a"v/(~mFm&[&`
4. Проверьте команды: `/users`, `/broadcast`, `/send`
