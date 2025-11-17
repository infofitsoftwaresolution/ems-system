@echo off
echo Starting Rural Samriddhi EMS...
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
        echo # Rural Samriddhi EMS - Local Development Environment
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
    ) > backend\.env
    echo Environment file created.
)

REM Create necessary directories
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\data" mkdir backend\data
if not exist "backend\logs" mkdir backend\logs

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo Setting up database and creating admin user...
call node src/seed.js
if %errorlevel% neq 0 (
    echo Failed to seed database
    pause
    exit /b 1
)

echo Starting backend server in separate window...
start "EMS Backend Server" powershell -NoExit -Command "cd '%~dp0backend'; echo 'Starting Backend Server...'; echo 'Backend will run on: http://localhost:3001'; echo 'Database: SQLite (data persists)'; echo ''; node src/server.js"

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

echo.
echo ========================================
echo Rural Samriddhi EMS is starting...
echo ========================================
echo Backend: http://localhost:3001 (in separate window)
echo Frontend: http://localhost:5173 (starting now)
echo.
echo Admin Credentials:
echo   Email: s24346379@gmail.com
echo   Password: rsamriddhi@6287
echo.
echo Features:
echo   - KYC form auto-scroll functionality
echo   - Production-ready admin account
echo   - SQLite database (data persists)
echo   - Email notifications working
echo.
echo Starting frontend development server in separate window...
start "EMS Frontend Server" powershell -NoExit -Command "cd '%~dp0frontend'; echo 'Starting Frontend Server...'; echo 'Frontend will run on: http://localhost:5173'; echo ''; npm run dev"

echo.
echo ========================================
echo Both servers are starting in separate windows!
echo ========================================
echo.
echo Backend Server: http://localhost:3001
echo Frontend Server: http://localhost:5173
echo.
echo Your data will persist in SQLite database.
echo Close the server windows to stop the servers.
echo.
echo Press any key to exit this setup window...
pause >nul
