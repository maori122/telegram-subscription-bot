# 📦 Загрузка на GitHub

## Шаг 1: Создайте репозиторий

1. Откройте https://github.com/new
2. Войдите как **maori122**
3. Заполните:
   - **Repository name:** `telegram-subscription-bot` (или любое другое)
   - **Description:** `Telegram bot для рекламных ссылок с отслеживанием подписок`
   - **Public** или **Private** - на ваш выбор
   - ❌ НЕ ставьте галочки на "Add README" и "Add .gitignore"
4. Нажмите **Create repository**

## Шаг 2: Загрузите код

Скопируйте команды с GitHub (они будут показаны после создания репозитория) или используйте эти:

```bash
git remote add origin https://github.com/maori122/telegram-subscription-bot.git
git branch -M main
git push -u origin main
```

Если GitHub попросит авторизацию:
- Username: `maori122`
- Password: используйте **Personal Access Token** (не обычный пароль)

### Как создать Personal Access Token:

1. Откройте https://github.com/settings/tokens
2. Нажмите **Generate new token** → **Generate new token (classic)**
3. Заполните:
   - **Note:** `Telegram Bot Upload`
   - **Expiration:** `No expiration` или `90 days`
   - **Scopes:** поставьте галочку на `repo`
4. Нажмите **Generate token**
5. **СКОПИРУЙТЕ ТОКЕН** (он больше не покажется!)
6. Используйте его вместо пароля при push

## Шаг 3: Проверьте

Откройте https://github.com/maori122/telegram-subscription-bot

Вы должны увидеть все файлы!

## Альтернатива: GitHub Desktop

Если не хотите использовать командную строку:

1. Скачайте GitHub Desktop: https://desktop.github.com/
2. Войдите как maori122
3. File → Add Local Repository → выберите папку проекта
4. Publish repository

---

## Готовые команды для копирования

```bash
# Добавить remote (замените название репозитория если нужно)
git remote add origin https://github.com/maori122/telegram-subscription-bot.git

# Переименовать ветку в main
git branch -M main

# Загрузить на GitHub
git push -u origin main
```

Если remote уже существует:
```bash
git remote set-url origin https://github.com/maori122/telegram-subscription-bot.git
git push -u origin main
```

---

## После загрузки

Ваш репозиторий будет доступен по адресу:
```
https://github.com/maori122/telegram-subscription-bot
```

Теперь можно переходить к деплою на Cloudflare Workers!

См. [CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md)
