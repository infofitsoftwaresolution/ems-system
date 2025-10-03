# ===========================================
# EMS Latest Version Deployment Script (Simple PowerShell)
# ===========================================
# This script updates your existing AWS deployment
# with the latest version of the EMS application

param(
    [string]$AWS_REGION = "us-east-1",
    [string]$ECR_REPOSITORY_BACKEND = "ems-backend",
    [string]$ECR_REPOSITORY_FRONTEND = "ems-frontend",
    [string]$EC2_HOST = "",
    [string]$EC2_USER = "ec2-user"
)

Write-Host "🚀 Starting EMS Latest Version Deployment" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue

# Get AWS Account ID
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$ECR_BACKEND_URL = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}"
$ECR_FRONTEND_URL = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}"

Write-Host "🎯 Starting deployment process..." -ForegroundColor Blue

# Step 1: Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue

# Check AWS CLI
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is installed" -ForegroundColor Green
}
catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Step 2: Login to ECR
Write-Host "🔐 Logging into ECR..." -ForegroundColor Blue
$loginCommand = aws ecr get-login-password --region $AWS_REGION
$loginCommand | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
Write-Host "✅ ECR login successful" -ForegroundColor Green

# Step 3: Build and push backend
Write-Host "🏗️  Building backend image..." -ForegroundColor Blue
docker build -f deployment/docker/Dockerfile.backend -t "${ECR_BACKEND_URL}:latest" .

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker tag "${ECR_BACKEND_URL}:latest" "${ECR_BACKEND_URL}:$timestamp"

Write-Host "📤 Pushing backend image to ECR..." -ForegroundColor Blue
docker push "${ECR_BACKEND_URL}:latest"
docker push "${ECR_BACKEND_URL}:$timestamp"
Write-Host "✅ Backend image built and pushed successfully" -ForegroundColor Green

# Step 4: Build and push frontend
Write-Host "🏗️  Building frontend image..." -ForegroundColor Blue
docker build -f deployment/docker/Dockerfile.frontend -t "${ECR_FRONTEND_URL}:latest" .

docker tag "${ECR_FRONTEND_URL}:latest" "${ECR_FRONTEND_URL}:$timestamp"

Write-Host "📤 Pushing frontend image to ECR..." -ForegroundColor Blue
docker push "${ECR_FRONTEND_URL}:latest"
docker push "${ECR_FRONTEND_URL}:$timestamp"
Write-Host "✅ Frontend image built and pushed successfully" -ForegroundColor Green

# Step 5: Update EC2 deployment (if EC2_HOST is provided)
if (-not [string]::IsNullOrEmpty($EC2_HOST)) {
    Write-Host "🔄 Updating EC2 deployment..." -ForegroundColor Blue
    
    # Create deployment script for EC2
    $updateScript = @"
#!/bin/bash
set -e

echo "🔄 Updating EMS deployment on EC2..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Stop existing containers
docker-compose -f /opt/ems/docker-compose.yml down || true

# Pull latest images
docker pull $ECR_BACKEND_URL`:latest
docker pull $ECR_FRONTEND_URL`:latest

# Update docker-compose.yml with new image URLs
cat > /opt/ems/docker-compose.yml << 'DOCKER_COMPOSE_EOF'
version: '3.8'

services:
  backend:
    image: $ECR_BACKEND_URL`:latest
    container_name: ems-backend
    environment:
      NODE_ENV: production
      DB_PATH: /app/database.sqlite
      JWT_SECRET: `$`{JWT_SECRET:-your-super-secret-jwt-key}
      PORT: 3001
      LOG_LEVEL: `$`{LOG_LEVEL:-info}
    ports:
      - "3001:3001"
    volumes:
      - uploads_data:/app/uploads
      - database_data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network

  frontend:
    image: $ECR_FRONTEND_URL`:latest
    container_name: ems-frontend
    environment:
      BACKEND_URL: http://backend:3001
      NGINX_ENVSUBST_OUTPUT_DIR: /etc/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl-certs:/etc/ssl/certs:ro
      - nginx_cache:/var/cache/nginx
    restart: unless-stopped
    networks:
      - app-network

volumes:
  uploads_data:
    driver: local
  database_data:
    driver: local
  nginx_cache:
    driver: local

networks:
  app-network:
    driver: bridge
DOCKER_COMPOSE_EOF

# Start services
docker-compose -f /opt/ems/docker-compose.yml up -d

echo "✅ EMS deployment updated successfully!"
"@

    # Save script to temporary file
    $tempScript = [System.IO.Path]::GetTempFileName()
    $updateScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    # Copy script to EC2 and execute
    scp -i ~/.ssh/ems-key.pem $tempScript "${EC2_USER}@${EC2_HOST}:/tmp/update-ems.sh"
    ssh -i ~/.ssh/ems-key.pem "${EC2_USER}@${EC2_HOST}" "chmod +x /tmp/update-ems.sh && /tmp/update-ems.sh"
    
    # Clean up temporary file
    Remove-Item $tempScript
    
    Write-Host "✅ EC2 deployment updated successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  EC2_HOST not set. Skipping EC2 deployment update." -ForegroundColor Yellow
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "✅ Backend Image: $ECR_BACKEND_URL`:latest" -ForegroundColor Green
Write-Host "✅ Frontend Image: $ECR_FRONTEND_URL`:latest" -ForegroundColor Green
Write-Host "🌐 Your EMS application should be running on your EC2 instance" -ForegroundColor Blue
