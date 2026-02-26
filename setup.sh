#!/bin/bash

echo "🚀 Настройка Telegram бота для Cloudflare Workers"
echo ""

# Проверка установки wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler не установлен. Устанавливаю..."
    npm install -g wrangler
fi

echo "✅ Wrangler установлен"
echo ""

# Логин в Cloudflare
echo "🔐 Войдите в Cloudflare..."
wrangler login

echo ""
echo "📦 Создание KV namespace..."
KV_OUTPUT=$(wrangler kv:namespace create "USERS")
KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+')

if [ -z "$KV_ID" ]; then
    echo "❌ Не удалось создать KV namespace"
    exit 1
fi

echo "✅ KV namespace создан: $KV_ID"
echo ""

# Обновление wrangler.toml
echo "📝 Обновление wrangler.toml..."
sed -i "s/your_kv_namespace_id/$KV_ID/" wrangler.toml
echo "✅ wrangler.toml обновлен"
echo ""

# Настройка секретов
echo "🔑 Настройка секретов..."
echo ""
echo "Введите токен бота от @BotFather:"
wrangler secret put BOT_TOKEN

echo ""
echo "Введите пароль админа (по умолчанию: Yp~?L*W<a\"v/(~mFm&[&):"
wrangler secret put ADMIN_PASSWORD

echo ""
echo "✅ Секреты настроены"
echo ""

# Деплой
echo "🚀 Деплой на Cloudflare Workers..."
wrangler deploy

echo ""
echo "✅ Бот задеплоен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Скопируйте URL вашего worker (показан выше)"
echo "2. Установите webhook:"
echo "   curl \"https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=YOUR_WORKER_URL\""
echo ""
echo "3. Проверьте бота в Telegram!"
echo ""
echo "Пароль админа: Yp~?L*W<a\"v/(~mFm&[&"
