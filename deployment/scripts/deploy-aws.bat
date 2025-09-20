@echo off
echo  Starting AWS Deployment for Employee Management System...

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %errorlevel% neq 0 (
    echo  AWS CLI is not installed. Please install it first.
    pause
    exit /b 1
)

REM Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo  Docker is not installed. Please install it first.
    pause
    exit /b 1
)

echo  Prerequisites check passed!

REM Set variables
set AWS_REGION=us-east-1
set ECR_REPOSITORY_NAME=employee-management-system
set CLUSTER_NAME=ems-cluster
set SERVICE_NAME=ems-service
set TASK_DEFINITION_NAME=ems-task

REM Get AWS account ID
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i
set ECR_URI=%AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com

echo  AWS Account ID: %AWS_ACCOUNT_ID%
echo  ECR URI: %ECR_URI%

REM Create ECR repository if it doesn't exist
echo  Creating ECR repository...
aws ecr create-repository --repository-name %ECR_REPOSITORY_NAME% --region %AWS_REGION% 2>nul || echo Repository already exists

REM Login to ECR
echo  Logging in to ECR...
aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %ECR_URI%

REM Build and push backend image
echo  Building backend image...
docker build -t %ECR_REPOSITORY_NAME%-backend -f ../docker/Dockerfile.backend ..
docker tag %ECR_REPOSITORY_NAME%-backend:latest %ECR_URI%/%ECR_REPOSITORY_NAME%-backend:latest
docker push %ECR_URI%/%ECR_REPOSITORY_NAME%-backend:latest

REM Build and push frontend image
echo  Building frontend image...
docker build -t %ECR_REPOSITORY_NAME%-frontend -f ../docker/Dockerfile.frontend ../..
docker tag %ECR_REPOSITORY_NAME%-frontend:latest %ECR_URI%/%ECR_REPOSITORY_NAME%-frontend:latest
docker push %ECR_URI%/%ECR_REPOSITORY_NAME%-frontend:latest

echo  Images pushed to ECR successfully!

REM Create ECS cluster if it doesn't exist
echo  Creating ECS cluster...
aws ecs create-cluster --cluster-name %CLUSTER_NAME% --region %AWS_REGION% 2>nul || echo Cluster already exists

echo  Deployment completed successfully!
echo.
echo  Next steps:
echo 1. Set up RDS PostgreSQL database
echo 2. Configure secrets in AWS Secrets Manager
echo 3. Create Application Load Balancer
echo 4. Create ECS service with the task definition
echo 5. Configure domain and SSL certificate
echo.
echo  See deploy-aws.md for detailed instructions
echo.
pause
