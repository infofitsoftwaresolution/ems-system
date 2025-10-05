@echo off
echo ========================================
echo Email Configuration Setup
echo ========================================
echo.

REM Check if .env file exists
if exist ".env" (
    echo SUCCESS: .env file found
) else (
    echo Creating .env file...
    (
        echo # Rural Samridhi EMS - Environment Configuration
        echo.
        echo PORT=3001
        echo NODE_ENV=production
        echo.
        echo DB_DIALECT=sqlite
        echo DB_STORAGE=./database.sqlite
        echo.
        echo JWT_SECRET=your-super-secret-jwt-key-ems-2024-production
        echo JWT_EXPIRES_IN=24h
        echo.
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-gmail-app-password
        echo.
        echo MAX_FILE_SIZE=5242880
        echo UPLOAD_PATH=./uploads
        echo FRONTEND_URL=http://localhost:5173
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo LOG_LEVEL=info
        echo DEBUG=false
        echo ENABLE_REQUEST_LOGGING=false
    ) > .env
    echo SUCCESS: .env file created
)

echo.
echo Email Configuration Instructions:
echo 1. Open .env file in a text editor
echo 2. Update these lines:
echo    SMTP_USER=your-actual-email@gmail.com
echo    SMTP_PASS=your-gmail-app-password
echo.
echo 3. To get Gmail App Password:
echo    - Go to Google Account ^> Security ^> 2-Step Verification
echo    - Click 'App passwords' ^> Generate password for 'Mail'
echo    - Use that password (not your regular Gmail password)
echo.
echo 4. Test email configuration:
echo    node test-email.js
echo.
echo Press any key to continue...
pause >nul
