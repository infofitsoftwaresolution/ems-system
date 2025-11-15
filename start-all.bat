@echo off
echo ========================================
echo Starting EMS System
echo ========================================
echo.
echo Starting Backend Server in new window...
start "Backend Server" cmd /k "cd /d %~dp0backend && node src/server.js"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server in new window...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul

