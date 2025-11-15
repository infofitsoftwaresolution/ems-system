@echo off
title Backend Server - EMS System
color 0A
echo ========================================
echo   EMS System - Backend Server
echo ========================================
echo.
cd /d %~dp0backend
echo Starting server on http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.
node src/server.js

