# 🚀 Быстрый деплой на Railway.app

## Шаг 1: Загрузите код на GitHub

1. Создайте новый репозиторий на https://github.com/new
2. Выполните команды:

```bash
git remote add origin https://github.com/ваш-username/ваш-репозиторий.git
git branch -M main
git push -u origin main
```

## Шаг 2: Деплой на Railway

1. Откройте https://railway.app
2. Нажмите "Login" → войдите через GitHub
3. Нажмите "New Project"
4. Выберите "Deploy from GitHub repo"
5. Выберите ваш репозиторий
6. Railway автоматически определит Python и начнет деплой

## Шаг 3: Настройте переменные окружения

1. В проекте Railway перейдите в "Variables"
2. Добавьте две переменные:

```
BOT_TOKEN = ваш_токен_от_BotFather
ADMIN_PASSWORD_HASH = $2b$12$VXMamfd.bj8OUIPzj65ZV.kJMs/r.VDcqOG08GNjk8AafXOVGkepS
```

3. Railway автоматически перезапустит бота

## Шаг 4: Проверьте работу

1. Откройте бота в Telegram
2. Отправьте `/start`
3. Авторизуйтесь: `/admin Yp~?L*W<a"v/(~mFm&[&`
4. Проверьте команды!

## ✅ Готово!

Ваш бот теперь работает 24/7 на Railway!

---

## Альтернатива: Render.com

Если Railway не работает, используйте Render.com:

1. https://render.com → Sign Up
2. New → Background Worker
3. Connect GitHub repository
4. Settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python bot.py`
5. Add Environment Variables (те же самые)
6. Create Background Worker

---

## 💡 Полезные ссылки

- Railway Dashboard: https://railway.app/dashboard
- Логи бота: в Railway нажмите на ваш проект → View Logs
- Перезапуск: в Railway нажмите на три точки → Restart

## ⚠️ Важно

- Бесплатный план Railway: 500 часов в месяц (достаточно для одного бота)
- Бесплатный план Render: бот засыпает после 15 минут неактивности
- Для постоянной работы используйте Railway или платный план
