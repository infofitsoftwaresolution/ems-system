@echo off
echo ========================================
echo Rural Samridhi EMS - Safe Startup
echo ========================================
echo This script will:
echo - Start both servers in separate windows
echo - Preserve all existing data
echo - Only create admin user if not exists
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo Node.js and npm are available.
echo.

REM Create environment file if it doesn't exist
if not exist "backend\.env" (
    echo Creating environment file...
    (
        echo # Rural Samridhi EMS - Local Development Environment
        echo.
        echo PORT=3001
        echo NODE_ENV=development
        echo JWT_SECRET=your-super-secret-jwt-key-ems-2024-local
        echo DB_DIALECT=sqlite
        echo DB_STORAGE=./database.sqlite
        echo LOG_LEVEL=info
        echo DEBUG=true
        echo ENABLE_REQUEST_LOGGING=true
        echo MAX_FILE_SIZE=5242880
        echo UPLOAD_PATH=./uploads
        echo FRONTEND_URL=http://localhost:5173
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo SMTP_USER=s24346379@gmail.com
        echo SMTP_PASS=edufxpcbkumsnsyo
    ) > backend\.env
    echo Environment file created.
)

REM Create necessary directories
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\data" mkdir backend\data
if not exist "backend\logs" mkdir backend\logs
if not exist "backups" mkdir backups

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo Setting up database (preserving existing data)...
call node src/seed.js
if %errorlevel% neq 0 (
    echo Failed to setup database
    pause
    exit /b 1
)

echo Starting backend server in separate window...
start "EMS Backend Server" powershell -NoExit -Command "cd '%~dp0backend'; echo '========================================'; echo 'EMS Backend Server Starting...'; echo '========================================'; echo 'Backend URL: http://localhost:3001'; echo 'Database: SQLite (data persists)'; echo 'Admin Email: s24346379@gmail.com'; echo 'Admin Password: rsamriddhi@6287'; echo '========================================'; echo ''; node src/server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Go back to root directory
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Starting frontend server in separate window...
start "EMS Frontend Server" powershell -NoExit -Command "cd '%~dp0frontend'; echo '========================================'; echo 'EMS Frontend Server Starting...'; echo '========================================'; echo 'Frontend URL: http://localhost:5173'; echo '========================================'; echo ''; npm run dev"

echo.
echo ========================================
echo Both servers are starting in separate windows!
echo ========================================
echo.
echo Backend Server: http://localhost:3001
echo Frontend Server: http://localhost:5173
echo.
echo Admin Credentials:
echo   Email: s24346379@gmail.com
echo   Password: rsamriddhi@6287
echo.
echo Features:
echo   - Data persistence (SQLite database)
echo   - Email notifications working
echo   - KYC form auto-scroll functionality
echo   - Production-ready admin account
echo.
echo Your data is safe and will persist between restarts.
echo Close the server windows to stop the servers.
echo.
echo Press any key to exit this setup window...
pause >nul


