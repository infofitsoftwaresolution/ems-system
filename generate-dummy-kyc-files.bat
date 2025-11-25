@echo off
echo Generating dummy KYC files for testing...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the Node.js script
node generate-dummy-kyc-files.js

echo.
echo Done! Check the dummy-kyc-files folder for test files.
pause

