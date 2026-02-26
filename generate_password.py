import bcrypt
import secrets
import string

def generate_strong_password(length=20):
    """Генерирует криптографически стойкий пароль"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def hash_password(password):
    """Хеширует пароль с использованием bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

if __name__ == '__main__':
    print("=== Генератор пароля для Telegram бота ===\n")
    
    choice = input("1 - Сгенерировать новый пароль\n2 - Захешировать свой пароль\nВыберите (1/2): ")
    
    if choice == '1':
        password = generate_strong_password()
        print(f"\n✅ Сгенерирован пароль: {password}")
    elif choice == '2':
        password = input("\nВведите ваш пароль: ")
    else:
        print("Неверный выбор!")
        exit(1)
    
    password_hash = hash_password(password)
    
    print(f"\n✅ Хеш пароля:\n{password_hash}")
    print("\n📝 Добавьте эту строку в ваш .env файл:")
    print(f"ADMIN_PASSWORD_HASH={password_hash}")
    print("\n⚠️ СОХРАНИТЕ ПАРОЛЬ В БЕЗОПАСНОМ МЕСТЕ!")
    print(f"Пароль для входа: {password}")
