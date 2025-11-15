@echo off
echo ========================================
echo Fixing Login Credentials
echo ========================================
echo.
echo Step 1: Stopping backend server (if running)...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Backend server stopped.
) else (
    echo No backend server was running.
)
timeout /t 3 /nobreak >nul
echo.
echo Step 2: Fixing credentials...
node check-login-credentials.js
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to fix credentials. Please check the error above.
    pause
    exit /b 1
)
echo.
echo Step 3: Starting backend server...
cd backend
start "Backend Server" cmd /k "node src/server.js"
timeout /t 2 /nobreak >nul
echo.
echo ========================================
echo Done! Backend server is starting...
echo.
echo LOGIN CREDENTIALS:
echo   Email: s24346379@gmail.com
echo   Password: rsamriddhi@6287
echo.
echo Wait a few seconds for the server to start, then try logging in.
echo ========================================
pause

