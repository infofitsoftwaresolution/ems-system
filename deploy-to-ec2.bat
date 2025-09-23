@echo off
REM Direct Docker Deployment to EC2 - Windows Batch Script
REM This script deploys the EMS application directly to EC2 using Docker

echo 🚀 Starting direct deployment to EC2...

REM Check if SSH key is provided
if "%SSH_KEY_PATH%"=="" (
    echo ❌ Please set SSH_KEY_PATH environment variable
    echo Example: set SSH_KEY_PATH=C:\path\to\your\key.pem
    pause
    exit /b 1
)

REM Check if SSH key exists
if not exist "%SSH_KEY_PATH%" (
    echo ❌ SSH key not found at: %SSH_KEY_PATH%
    pause
    exit /b 1
)

echo 📦 Building Docker images locally...

REM Build backend image
echo Building backend image...
docker build -f deployment/docker/Dockerfile.backend -t ems-backend:latest ./backend
if errorlevel 1 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)

REM Build frontend image
echo Building frontend image...
docker build -f deployment/docker/Dockerfile.frontend.ssl -t ems-frontend:latest .
if errorlevel 1 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo ✅ Docker images built successfully

REM Save Docker images to tar files
echo 💾 Saving Docker images...
docker save ems-backend:latest | gzip > ems-backend.tar.gz
docker save ems-frontend:latest | gzip > ems-frontend.tar.gz

echo 📤 Uploading files to EC2...

REM Upload Docker images
scp -i "%SSH_KEY_PATH%" ems-backend.tar.gz ec2-user@13.233.73.43:/tmp/
scp -i "%SSH_KEY_PATH%" ems-frontend.tar.gz ec2-user@13.233.73.43:/tmp/

REM Upload deployment files
scp -i "%SSH_KEY_PATH%" deployment/docker/docker-compose.yml ec2-user@13.233.73.43:/tmp/
scp -i "%SSH_KEY_PATH%" deployment/docker/nginx.conf ec2-user@13.233.73.43:/tmp/
scp -i "%SSH_KEY_PATH%" deployment/docker/entrypoint.sh ec2-user@13.233.73.43:/tmp/

echo 🔧 Setting up application on EC2...

REM Deploy on EC2
ssh -i "%SSH_KEY_PATH%" ec2-user@13.233.73.43 "set -e && echo '📁 Setting up directories...' && sudo mkdir -p /home/ec2-user/app && sudo mkdir -p /home/ec2-user/backups && sudo mkdir -p /home/ec2-user/app/uploads/kyc && sudo mkdir -p /home/ec2-user/app/uploads/payslips && sudo mkdir -p /home/ec2-user/app/ssl-certs && echo '🔄 Stopping existing containers...' && cd /home/ec2-user/app && sudo docker-compose down || true && echo '📦 Loading Docker images...' && sudo docker load -i /tmp/ems-backend.tar.gz && sudo docker load -i /tmp/ems-frontend.tar.gz && echo '📋 Copying deployment files...' && sudo cp /tmp/docker-compose.yml /home/ec2-user/app/ && sudo cp /tmp/nginx.conf /home/ec2-user/app/ && sudo cp /tmp/entrypoint.sh /home/ec2-user/app/ && sudo chmod +x /home/ec2-user/app/entrypoint.sh && echo '🔧 Setting up environment...' && echo NODE_ENV=production > /home/ec2-user/app/.env && echo DB_PATH=/app/database.sqlite >> /home/ec2-user/app/.env && echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> /home/ec2-user/app/.env && echo PORT=3001 >> /home/ec2-user/app/.env && echo BACKEND_URL=http://backend:3001 >> /home/ec2-user/app/.env && echo SSL_ENABLED=false >> /home/ec2-user/app/.env && echo '🚀 Starting application...' && cd /home/ec2-user/app && sudo docker-compose up -d && echo '⏳ Waiting for services to start...' && sleep 30 && echo '🔍 Checking service status...' && sudo docker-compose ps && echo '🏥 Running health checks...' && if curl -f http://localhost:3001/api/health; then echo '✅ Backend is healthy'; else echo '❌ Backend health check failed'; sudo docker-compose logs backend; exit 1; fi && if curl -f http://localhost; then echo '✅ Frontend is accessible'; else echo '❌ Frontend is not accessible'; sudo docker-compose logs frontend; exit 1; fi && echo '🧹 Cleaning up temporary files...' && rm -f /tmp/ems-backend.tar.gz /tmp/ems-frontend.tar.gz /tmp/docker-compose.yml /tmp/nginx.conf /tmp/entrypoint.sh && echo '✅ Deployment completed successfully!'"

REM Clean up local files
echo 🧹 Cleaning up local files...
del ems-backend.tar.gz
del ems-frontend.tar.gz

echo 🎉 Deployment completed successfully!
echo 🌐 Your application is now running at:
echo    Frontend: http://13.233.73.43
echo    Backend API: http://13.233.73.43:3001/api
echo    Health Check: http://13.233.73.43:3001/api/health
echo.
echo 📋 Useful commands:
echo    View logs: ssh -i %SSH_KEY_PATH% ec2-user@13.233.73.43 "cd /home/ec2-user/app && sudo docker-compose logs"
echo    Restart: ssh -i %SSH_KEY_PATH% ec2-user@13.233.73.43 "cd /home/ec2-user/app && sudo docker-compose restart"
echo    Stop: ssh -i %SSH_KEY_PATH% ec2-user@13.233.73.43 "cd /home/ec2-user/app && sudo docker-compose down"

pause
