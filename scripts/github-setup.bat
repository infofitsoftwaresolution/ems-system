@echo off
REM GitHub Setup Script for Rural Samridhi EMS
REM This script helps team members set up the project from GitHub

echo 🚀 Setting up Rural Samridhi EMS from GitHub...
echo ================================================

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js (v18+) first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed!

REM Clone repository if not already cloned
if not exist "ems-system" (
    echo 📥 Cloning repository...
    git clone https://github.com/infofitsoftwaresolution/ems-system.git
    cd ems-system
) else (
    echo 📁 Repository already exists, updating...
    cd ems-system
    git pull origin main
)

echo 📦 Installing dependencies...
call npm run install-all

echo 🗄️ Setting up database...
call npm run seed
call npm run seed:kyc

echo 🎉 Setup complete!
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo 👤 Default login credentials:
echo    Admin:    admin@ruralsamridhi.com / admin123
echo    Employee: employee@ruralsamridhi.com / employee123
echo.
echo 🚀 Start development servers:
echo    npm run dev
echo.
echo 📚 For more information, see:
echo    - SETUP_GUIDE.md
echo    - TEAM_QUICK_START.md
echo    - README.md

pause
