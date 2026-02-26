# Создание репозитория на GitHub

## Шаг 1: Создайте репозиторий

1. Откройте: https://github.com/new

2. Войдите как **maori122**

3. Заполните форму:
   - **Repository name:** `telegram-subscription-bot`
   - **Description:** `Telegram bot для рекламных ссылок с отслеживанием подписок`
   - **Public** (рекомендуется) или **Private**
   - ❌ **НЕ ставьте галочки:**
     - Add a README file
     - Add .gitignore
     - Choose a license

4. Нажмите **"Create repository"**

## Шаг 2: После создания репозитория

GitHub покажет страницу с инструкциями. Игнорируйте их и выполните эти команды:

```bash
git push -u origin main
```

Репозиторий уже настроен с токеном, просто нужно его создать на GitHub!

---

## Если все равно ошибка 403

Попробуйте этот способ:

1. Удалите remote:
```bash
git remote remove origin
```

2. Добавьте заново (замените YOUR_TOKEN на ваш токен):
```bash
git remote add origin https://YOUR_TOKEN@github.com/maori122/telegram-subscription-bot.git
```

3. Push:
```bash
git push -u origin main
```

---

## Альтернатива: GitHub Desktop

Если командная строка не работает:

1. Скачайте: https://desktop.github.com/
2. Войдите как maori122
3. File → Add Local Repository
4. Выберите папку проекта
5. Publish repository

Это проще и надежнее!
