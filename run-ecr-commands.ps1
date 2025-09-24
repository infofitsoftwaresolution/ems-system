# Run ECR Commands on EC2
# This script runs the exact commands you mentioned

param(
    [Parameter(Mandatory=$true)]
    [string]$SshKeyPath,
    
    [string]$AwsRegion = "ap-south-1",
    [string]$Ec2Host = "13.233.73.43",
    [string]$Ec2User = "ec2-user"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Running ECR commands on EC2..." -ForegroundColor Green

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

# Check if SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Host "❌ SSH key not found at: $SshKeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Running commands on EC2..." -ForegroundColor Yellow
Write-Host "ECR Registry: $ecrRegistry" -ForegroundColor Cyan

# Run the commands on EC2
$commands = @"
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $ecrRegistry

echo "📦 Pulling images from ECR..."
docker pull $ecrRegistry/ems-frontend:latest
docker pull $ecrRegistry/ems-backend:latest

echo "🔄 Stopping existing containers..."
docker stop ems-backend ems-frontend 2>/dev/null || true
docker rm ems-backend ems-frontend 2>/dev/null || true

echo "🚀 Starting containers..."

# Create uploads directory
mkdir -p /home/ec2-user/uploads/kyc
mkdir -p /home/ec2-user/uploads/payslips

# Backend
docker run -d -p 3001:3001 --name ems-backend -v /home/ec2-user/uploads:/app/uploads -e NODE_ENV=production -e DB_PATH=/app/database.sqlite -e JWT_SECRET=your-super-secret-jwt-key -e PORT=3001 $ecrRegistry/ems-backend:latest

# Frontend
docker run -d -p 80:80 --name ems-frontend -e BACKEND_URL=http://$Ec2Host:3001 $ecrRegistry/ems-frontend:latest

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking container status..."
docker ps

echo "🏥 Running health checks..."
curl -f http://localhost:3001/api/health && echo "✅ Backend is healthy" || echo "❌ Backend health check failed"
curl -f http://localhost && echo "✅ Frontend is accessible" || echo "❌ Frontend is not accessible"

echo "✅ Deployment completed!"
"@

ssh -i $SshKeyPath ${Ec2User}@${Ec2Host} $commands

Write-Host "🎉 Commands executed successfully!" -ForegroundColor Green
Write-Host "🌐 Your application should now be running at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$Ec2Host" -ForegroundColor White
Write-Host "   Backend API: http://$Ec2Host`:3001/api" -ForegroundColor White
Write-Host "   Health Check: http://$Ec2Host`:3001/api/health" -ForegroundColor White

