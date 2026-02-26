@echo off
chcp 65001 >nul
echo 🚀 Настройка Telegram бота для Cloudflare Workers
echo.

REM Проверка Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не установлен. Установите с https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js установлен
echo.

REM Установка Wrangler
echo 📦 Установка Wrangler CLI...
call npm install -g wrangler
echo.

REM Логин
echo 🔐 Войдите в Cloudflare...
call wrangler login
echo.

REM Создание KV namespace
echo 📦 Создание KV namespace...
call wrangler kv:namespace create "USERS" > kv_output.txt
echo ✅ KV namespace создан
echo.
echo ⚠️ ВАЖНО: Скопируйте ID из файла kv_output.txt и вставьте в wrangler.toml
echo.
type kv_output.txt
echo.
pause

REM Настройка секретов
echo.
echo 🔑 Настройка токена бота...
echo Введите токен от @BotFather:
call wrangler secret put BOT_TOKEN
echo.

echo 🔑 Настройка пароля админа...
echo Введите пароль (по умолчанию: Yp~?L*W^<a"v/(~mFm^&[^&):
call wrangler secret put ADMIN_PASSWORD
echo.

REM Деплой
echo 🚀 Деплой на Cloudflare Workers...
call wrangler deploy
echo.

echo ✅ Бот задеплоен!
echo.
echo 📋 Следующие шаги:
echo 1. Скопируйте URL вашего worker (показан выше)
echo 2. Откройте в браузере:
echo    https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=YOUR_WORKER_URL
echo.
echo 3. Проверьте бота в Telegram!
echo.
echo Пароль админа: Yp~?L*W^<a"v/(~mFm^&[^&
echo.

del kv_output.txt >nul 2>nul
pause
