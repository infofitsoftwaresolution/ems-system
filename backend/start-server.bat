@echo off
echo Starting Backend Server...
echo.
cd /d %~dp0
node src/server.js
pause

