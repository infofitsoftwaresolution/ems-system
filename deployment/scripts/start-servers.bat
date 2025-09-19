@echo off
echo Starting Employee Management System...
echo.

echo Starting Backend Server...
cd ../../backend
start "Backend Server" powershell -NoExit -Command "$env:PORT='3001'; $env:CLIENT_ORIGIN='http://localhost:3000'; $env:POSTGRES_HOST='localhost'; $env:POSTGRES_PORT='5432'; $env:POSTGRES_DB='ems'; $env:POSTGRES_USER='postgres'; $env:POSTGRES_PASSWORD='root'; $env:JWT_SECRET='dev-secret'; node src/server.js"
cd ../deployment/scripts

echo Starting Frontend Server...
cd ../../frontend
start "Frontend Server" powershell -NoExit -Command "npm start"
cd ../deployment/scripts

echo.
echo Servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Wait a moment for servers to fully start, then open http://localhost:3000
pause
