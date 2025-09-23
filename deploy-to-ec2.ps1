# Direct Docker Deployment to EC2 - PowerShell Script
# This script deploys the EMS application directly to EC2 using Docker

param(
    [Parameter(Mandatory=$true)]
    [string]$SshKeyPath,
    
    [string]$Ec2Host = "13.233.73.43",
    [string]$Ec2User = "ec2-user"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting direct deployment to EC2..." -ForegroundColor Green

# Check if SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Host "❌ SSH key not found at: $SshKeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Building Docker images locally..." -ForegroundColor Yellow

# Build backend image
Write-Host "Building backend image..." -ForegroundColor Cyan
docker build -f deployment/docker/Dockerfile.backend -t ems-backend:latest ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

# Build frontend image
Write-Host "Building frontend image..." -ForegroundColor Cyan
docker build -f deployment/docker/Dockerfile.frontend.ssl -t ems-frontend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker images built successfully" -ForegroundColor Green

# Save Docker images to tar files
Write-Host "💾 Saving Docker images..." -ForegroundColor Yellow
docker save ems-backend:latest | gzip > ems-backend.tar.gz
docker save ems-frontend:latest | gzip > ems-frontend.tar.gz

Write-Host "📤 Uploading files to EC2..." -ForegroundColor Yellow

# Upload Docker images
scp -i $SshKeyPath ems-backend.tar.gz ${Ec2User}@${Ec2Host}:/tmp/
scp -i $SshKeyPath ems-frontend.tar.gz ${Ec2User}@${Ec2Host}:/tmp/

# Upload deployment files
scp -i $SshKeyPath deployment/docker/docker-compose.yml ${Ec2User}@${Ec2Host}:/tmp/
scp -i $SshKeyPath deployment/docker/nginx.conf ${Ec2User}@${Ec2Host}:/tmp/
scp -i $SshKeyPath deployment/docker/entrypoint.sh ${Ec2User}@${Ec2Host}:/tmp/

Write-Host "🔧 Setting up application on EC2..." -ForegroundColor Yellow

# Deploy on EC2
$deployScript = @"
set -e
echo "📁 Setting up directories..."
sudo mkdir -p /home/ec2-user/app
sudo mkdir -p /home/ec2-user/backups
sudo mkdir -p /home/ec2-user/app/uploads/kyc
sudo mkdir -p /home/ec2-user/app/uploads/payslips
sudo mkdir -p /home/ec2-user/app/ssl-certs

echo "🔄 Stopping existing containers..."
cd /home/ec2-user/app
sudo docker-compose down || true

echo "📦 Loading Docker images..."
sudo docker load -i /tmp/ems-backend.tar.gz
sudo docker load -i /tmp/ems-frontend.tar.gz

echo "📋 Copying deployment files..."
sudo cp /tmp/docker-compose.yml /home/ec2-user/app/
sudo cp /tmp/nginx.conf /home/ec2-user/app/
sudo cp /tmp/entrypoint.sh /home/ec2-user/app/
sudo chmod +x /home/ec2-user/app/entrypoint.sh

echo "🔧 Setting up environment..."
cat > /home/ec2-user/app/.env << 'ENVEOF'
NODE_ENV=production
DB_PATH=/app/database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
BACKEND_URL=http://backend:3001
SSL_ENABLED=false
ENVEOF

echo "🚀 Starting application..."
cd /home/ec2-user/app
sudo docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking service status..."
sudo docker-compose ps

echo "🏥 Running health checks..."
if curl -f http://localhost:3001/api/health; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    sudo docker-compose logs backend
    exit 1
fi

if curl -f http://localhost; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    sudo docker-compose logs frontend
    exit 1
fi

echo "🧹 Cleaning up temporary files..."
rm -f /tmp/ems-backend.tar.gz /tmp/ems-frontend.tar.gz /tmp/docker-compose.yml /tmp/nginx.conf /tmp/entrypoint.sh

echo "✅ Deployment completed successfully!"
"@

ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} $deployScript

# Clean up local files
Write-Host "🧹 Cleaning up local files..." -ForegroundColor Yellow
Remove-Item -Force ems-backend.tar.gz -ErrorAction SilentlyContinue
Remove-Item -Force ems-frontend.tar.gz -ErrorAction SilentlyContinue

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your application is now running at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$Ec2Host" -ForegroundColor White
Write-Host "   Backend API: http://$Ec2Host`:3001/api" -ForegroundColor White
Write-Host "   Health Check: http://$Ec2Host`:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Yellow
Write-Host "   View logs: ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} 'cd /home/ec2-user/app && sudo docker-compose logs'" -ForegroundColor White
Write-Host "   Restart: ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} 'cd /home/ec2-user/app && sudo docker-compose restart'" -ForegroundColor White
Write-Host "   Stop: ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} 'cd /home/ec2-user/app && sudo docker-compose down'" -ForegroundColor White
