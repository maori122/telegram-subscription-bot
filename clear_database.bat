@echo off
echo ========================================
echo   ОЧИСТКА БАЗЫ ДАННЫХ
echo ========================================
echo.
echo Это удалит ВСЕ данные из базы:
echo - Всех пользователей
echo - Всех админов
echo - Настройки ответа
echo - Состояния пользователей
echo.
set /p confirm="Вы уверены? (yes/no): "

if /i "%confirm%" NEQ "yes" (
    echo Отменено.
    pause
    exit /b
)

echo.
echo Удаление данных...

wrangler kv key delete "users" --namespace-id=0bdc2526f64744359d0793717d52e7ad --remote
wrangler kv key delete "admins" --namespace-id=0bdc2526f64744359d0793717d52e7ad --remote
wrangler kv key delete "response_template" --namespace-id=0bdc2526f64744359d0793717d52e7ad --remote

echo.
echo ✅ База данных очищена!
echo.
echo Теперь нужно заново:
echo 1. Зарегистрироваться через /start
echo 2. Авторизоваться как админ: /admin ВАШ_ПАРОЛЬ
echo.
pause
