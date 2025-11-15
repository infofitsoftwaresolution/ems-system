@echo off
echo ========================================
echo Starting Backend Server...
echo ========================================
cd backend
echo Current directory: %CD%
echo.
node src/server.js
pause

