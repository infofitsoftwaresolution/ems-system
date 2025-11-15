@echo off
echo ========================================
echo Fixing Database Lock Issue
echo ========================================
echo.
echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Step 2: Waiting for database to unlock...
timeout /t 3 /nobreak >nul
echo.
echo Step 3: Running seed script...
cd backend
node src/seed.js
echo.
echo Step 4: Starting backend server...
start "Backend Server" cmd /k "node src/server.js"
echo.
echo ========================================
echo Done! Backend server is starting...
echo ========================================
pause

