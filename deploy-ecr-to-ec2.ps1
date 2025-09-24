# ECR to EC2 Deployment Script
# This script builds images, pushes to ECR, and deploys on EC2

param(
    [Parameter(Mandatory=$true)]
    [string]$SshKeyPath,
    
    [string]$AwsRegion = "ap-south-1",
    [string]$Ec2Host = "13.233.73.43",
    [string]$Ec2User = "ec2-user"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting ECR to EC2 deployment..." -ForegroundColor Green

# Get AWS account ID
Write-Host "🔍 Getting AWS account ID..." -ForegroundColor Yellow
try {
    $accountId = aws sts get-caller-identity --query Account --output text
    if (-not $accountId) {
        throw "Failed to get AWS account ID"
    }
    Write-Host "✅ AWS Account ID: $accountId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get AWS account ID. Make sure AWS CLI is configured." -ForegroundColor Red
    Write-Host "Run: aws configure" -ForegroundColor Yellow
    exit 1
}

$ecrRegistry = "${accountId}.dkr.ecr.${AwsRegion}.amazonaws.com"

# Create ECR repositories if they don't exist
Write-Host "📦 Creating ECR repositories..." -ForegroundColor Yellow

try {
    aws ecr create-repository --repository-name ems-backend --region $AwsRegion 2>$null
    Write-Host "✅ ECR repository 'ems-backend' ready" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ ECR repository 'ems-backend' already exists" -ForegroundColor Cyan
}

try {
    aws ecr create-repository --repository-name ems-frontend --region $AwsRegion 2>$null
    Write-Host "✅ ECR repository 'ems-frontend' ready" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ ECR repository 'ems-frontend' already exists" -ForegroundColor Cyan
}

# Login to ECR
Write-Host "🔐 Logging into ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $ecrRegistry

# Build and tag images
Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow

# Build backend
Write-Host "Building backend image..." -ForegroundColor Cyan
docker build -f deployment/docker/Dockerfile.backend -t ems-backend:latest ./backend
docker tag ems-backend:latest "${ecrRegistry}/ems-backend:latest"

# Build frontend
Write-Host "Building frontend image..." -ForegroundColor Cyan
docker build -f deployment/docker/Dockerfile.frontend.ssl -t ems-frontend:latest .
docker tag ems-frontend:latest "${ecrRegistry}/ems-frontend:latest"

# Push images to ECR
Write-Host "📤 Pushing images to ECR..." -ForegroundColor Yellow
docker push "${ecrRegistry}/ems-backend:latest"
docker push "${ecrRegistry}/ems-frontend:latest"

Write-Host "✅ Images pushed to ECR successfully" -ForegroundColor Green

# Deploy on EC2
Write-Host "🚀 Deploying on EC2..." -ForegroundColor Yellow

$deployScript = @"
set -e

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $ecrRegistry

echo "🔄 Stopping existing containers..."
docker stop ems-backend ems-frontend 2>/dev/null || true
docker rm ems-backend ems-frontend 2>/dev/null || true

echo "📦 Pulling latest images from ECR..."
docker pull $ecrRegistry/ems-backend:latest
docker pull $ecrRegistry/ems-frontend:latest

echo "🚀 Starting containers..."

# Create uploads directory
mkdir -p /home/ec2-user/uploads/kyc
mkdir -p /home/ec2-user/uploads/payslips

# Run backend container
docker run -d --name ems-backend -p 3001:3001 -v /home/ec2-user/uploads:/app/uploads -e NODE_ENV=production -e DB_PATH=/app/database.sqlite -e JWT_SECRET=your-super-secret-jwt-key-change-this-in-production -e PORT=3001 $ecrRegistry/ems-backend:latest

# Run frontend container
docker run -d --name ems-frontend -p 80:80 -e BACKEND_URL=http://$Ec2Host:3001 $ecrRegistry/ems-frontend:latest

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking container status..."
docker ps

echo "🏥 Running health checks..."
if curl -f http://localhost:3001/api/health; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker logs ems-backend
    exit 1
fi

if curl -f http://localhost; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    docker logs ems-frontend
    exit 1
fi

echo "✅ Deployment completed successfully!"
"@

# Check if SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Host "❌ SSH key not found at: $SshKeyPath" -ForegroundColor Red
    exit 1
}

ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} $deployScript

Write-Host "🎉 ECR to EC2 deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your application is now running at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$Ec2Host" -ForegroundColor White
Write-Host "   Backend API: http://$Ec2Host`:3001/api" -ForegroundColor White
Write-Host "   Health Check: http://$Ec2Host`:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 ECR Images:" -ForegroundColor Yellow
Write-Host "   Backend: $ecrRegistry/ems-backend:latest" -ForegroundColor White
Write-Host "   Frontend: $ecrRegistry/ems-frontend:latest" -ForegroundColor White
Write-Host ""
Write-Host "📋 Management commands:" -ForegroundColor Yellow
Write-Host "   View logs: ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} 'docker logs ems-backend ems-frontend'" -ForegroundColor White
Write-Host "   Restart: ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} 'docker restart ems-backend ems-frontend'" -ForegroundColor White
Write-Host "   Stop: ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} 'docker stop ems-backend ems-frontend'" -ForegroundColor White
