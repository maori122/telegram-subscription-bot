import os
import json
import bcrypt
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
ADMIN_PASSWORD_HASH = os.getenv('ADMIN_PASSWORD_HASH')
USERS_FILE = 'users.json'
ADMINS_FILE = 'admins.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def load_admins():
    if os.path.exists(ADMINS_FILE):
        with open(ADMINS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_admins(admins):
    with open(ADMINS_FILE, 'w', encoding='utf-8') as f:
        json.dump(admins, f, ensure_ascii=False, indent=2)

def is_admin(user_id):
    admins = load_admins()
    return str(user_id) in admins

users = load_users()
admins = load_admins()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    username = update.effective_user.username or "Без username"
    first_name = update.effective_user.first_name or ""
    
    if user_id not in users:
        users[user_id] = {'username': username, 'first_name': first_name, 'registered': True}
        save_users(users)
        await update.message.reply_text(f"Привет, {first_name}! Вы успешно зарегистрированы.")
    else:
        await update.message.reply_text(f"Вы уже зарегистрированы, {first_name}!")

async def admin_login(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if is_admin(user_id):
        await update.message.reply_text("Вы уже авторизованы как администратор!")
        return
    if not context.args:
        await update.message.reply_text("Использование: /admin <пароль>")
        return
    password = ' '.join(context.args)
    if ADMIN_PASSWORD_HASH and bcrypt.checkpw(password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8')):
        admins = load_admins()
        admins[user_id] = {'username': update.effective_user.username or "Без username", 'first_name': update.effective_user.first_name or "", 'authorized': True}
        save_admins(admins)
        try:
            await update.message.delete()
        except:
            pass
        await context.bot.send_message(chat_id=update.effective_chat.id, text=f"✅ {update.effective_user.first_name}, вы успешно авторизованы как администратор!")
    else:
        await update.message.reply_text("❌ Неверный пароль!")
        try:
            await update.message.delete()
        except:
            pass

async def list_users(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("У вас нет доступа к этой команде.")
        return
    if not users:
        await update.message.reply_text("Нет зарегистрированных пользователей.")
        return
    message = "📋 Зарегистрированные пользователи:\n\n"
    for user_id, data in users.items():
        message += f"ID: {user_id}\nИмя: {data['first_name']}\nUsername: @{data['username']}\n\n"
    await update.message.reply_text(message)

async def broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("У вас нет доступа к этой команде.")
        return
    if not context.args:
        await update.message.reply_text("Использование: /broadcast <сообщение>")
        return
    message = ' '.join(context.args)
    success = 0
    failed = 0
    for user_id in users.keys():
        try:
            await context.bot.send_message(chat_id=int(user_id), text=message)
            success += 1
        except Exception as e:
            failed += 1
    await update.message.reply_text(f"✅ Рассылка завершена!\nУспешно: {success}\nОшибок: {failed}")

async def send_to_user(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("У вас нет доступа к этой команде.")
        return
    if len(context.args) < 2:
        await update.message.reply_text("Использование: /send <@username или user_id> <сообщение>")
        return
    target = context.args[0]
    message = ' '.join(context.args[1:])
    if target.startswith('@'):
        target = target[1:]
    target_user_id = None
    target_display = target
    if target.isdigit():
        if target in users:
            target_user_id = target
    else:
        for user_id, data in users.items():
            if data['username'].lower() == target.lower():
                target_user_id = user_id
                target_display = f"@{target}"
                break
    if not target_user_id:
        await update.message.reply_text(f"❌ Пользователь {target_display} не найден.")
        return
    try:
        await context.bot.send_message(chat_id=int(target_user_id), text=message)
        await update.message.reply_text(f"✅ Сообщение отправлено пользователю {target_display}")
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка отправки: {e}")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if is_admin(update.effective_user.id):
        help_text = "🤖 Команды администратора:\n/start - Регистрация\n/admin <пароль> - Авторизация\n/users - Список пользователей\n/broadcast <текст> - Рассылка всем\n/send <@username> <текст> - Отправить конкретному\n/help - Помощь"
    else:
        help_text = "🤖 Доступные команды:\n/start - Регистрация в боте\n/admin <пароль> - Авторизация как администратор\n/help - Помощь"
    await update.message.reply_text(help_text)

def main():
    if not BOT_TOKEN:
        print("Ошибка: BOT_TOKEN не найден в .env файле")
        return
    if not ADMIN_PASSWORD_HASH:
        print("Ошибка: ADMIN_PASSWORD_HASH не найден в .env файле")
        return
    print("Бот запущен...")
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("admin", admin_login))
    app.add_handler(CommandHandler("users", list_users))
    app.add_handler(CommandHandler("broadcast", broadcast))
    app.add_handler(CommandHandler("send", send_to_user))
    app.add_handler(CommandHandler("help", help_command))
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
