#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$EC2_HOST,
    
    [Parameter(Mandatory=$true)]
    [string]$EC2_USER,
    
    [Parameter(Mandatory=$true)]
    [string]$AWS_REGION
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$AWS_ACCOUNT_ID = "777555685730"
$ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
$BACKEND_IMAGE = "${ECR_REGISTRY}/ems-backend:latest"
$FRONTEND_IMAGE = "${ECR_REGISTRY}/ems-frontend:latest"

Write-Host "Starting EMS Latest Version Deployment" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

try {
    # Step 1: Login to ECR
    Write-Host "Step 1: Logging into ECR..." -ForegroundColor Yellow
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    if ($LASTEXITCODE -ne 0) {
        throw "ECR login failed"
    }
    Write-Host "ECR login successful" -ForegroundColor Green

    # Step 2: Build Backend Image
    Write-Host "Step 2: Building backend image..." -ForegroundColor Yellow
    docker build -f deployment/docker/Dockerfile.backend -t $BACKEND_IMAGE .
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed"
    }
    Write-Host "Backend image built successfully" -ForegroundColor Green

    # Step 3: Push Backend Image
    Write-Host "Step 3: Pushing backend image to ECR..." -ForegroundColor Yellow
    docker push $BACKEND_IMAGE
    if ($LASTEXITCODE -ne 0) {
        throw "Backend push failed"
    }
    Write-Host "Backend image pushed successfully" -ForegroundColor Green

    # Step 4: Build Frontend Image
    Write-Host "Step 4: Building frontend image..." -ForegroundColor Yellow
    docker build -f deployment/docker/Dockerfile.frontend -t $FRONTEND_IMAGE .
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
    Write-Host "Frontend image built successfully" -ForegroundColor Green

    # Step 5: Push Frontend Image
    Write-Host "Step 5: Pushing frontend image to ECR..." -ForegroundColor Yellow
    docker push $FRONTEND_IMAGE
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend push failed"
    }
    Write-Host "Frontend image pushed successfully" -ForegroundColor Green

    # Step 6: Update EC2 Instance
    Write-Host "Step 6: Updating EC2 instance..." -ForegroundColor Yellow
    
    # Create temporary script for EC2
    $ec2Script = @"
#!/bin/bash
set -e

echo "Updating EMS on EC2..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest images
docker pull $BACKEND_IMAGE
docker pull $FRONTEND_IMAGE

# Stop existing containers
cd /opt/ems
docker-compose down

# Start with new images
docker-compose up -d

echo "EMS updated successfully!"
"@

    # Save script to temporary file
    $tempScript = "update-ems.sh"
    $ec2Script | Out-File -FilePath $tempScript -Encoding UTF8

    # Copy script to EC2 and execute
    Write-Host "Copying update script to EC2..." -ForegroundColor Yellow
    scp -i ~/.ssh/ems-key.pem $tempScript ${EC2_USER}@${EC2_HOST}:/tmp/
    
    Write-Host "Executing update script on EC2..." -ForegroundColor Yellow
    ssh -i ~/.ssh/ems-key.pem ${EC2_USER}@${EC2_HOST} "chmod +x /tmp/$tempScript && /tmp/$tempScript"

    # Clean up
    Remove-Item $tempScript -Force

    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "Backend Image: $BACKEND_IMAGE" -ForegroundColor Green
    Write-Host "Frontend Image: $FRONTEND_IMAGE" -ForegroundColor Green
    Write-Host "Your EMS application should be running on: http://$EC2_HOST" -ForegroundColor Green

} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
