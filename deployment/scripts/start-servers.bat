@echo off
echo Starting Employee Management System...
echo.

echo Starting Backend Server...
cd ../../backend
start "Backend Server" powershell -NoExit -Command "='3001'; ='http://localhost:3000'; ='localhost'; ='5432'; ='ems'; ='postgres'; ='root'; ='dev-secret'; ='s24346379@gmail.com'; ='edufxpcbkumsnsyo'; node src/server.js"
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
