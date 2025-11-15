@echo off
echo ========================================
echo Starting Frontend Server...
echo ========================================
cd frontend
echo Current directory: %CD%
echo.
npm run dev
pause

