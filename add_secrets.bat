@echo off
echo Adding BOT_TOKEN secret...
echo 7656364226:AAF5Xnz2C7cTt11MEgCdFY3M-OkNeRMVLoY | wrangler secret put BOT_TOKEN

echo.
echo Adding ADMIN_PASSWORD secret...
echo ny9FL5JXopQhRDq2EY4bxXMiHO4/SQCM | wrangler secret put ADMIN_PASSWORD

echo.
echo Secrets added successfully!
pause
