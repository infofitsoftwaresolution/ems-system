#!/bin/bash

echo " Starting EMS ECR Deployment..."

# Set AWS region and account details
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="777555685730"
ECR_REGISTRY=".dkr.ecr..amazonaws.com"
REPOSITORY_NAME="employee-management-system"

echo " Configuration:"
echo "   AWS Region: "
echo "   Account ID: "
echo "   ECR Registry: "
echo "   Repository: "

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo " AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo " Docker is not installed. Please install it first."
    exit 1
fi

echo " Prerequisites check passed!"

# Login to ECR
echo " Logging in to ECR..."
aws ecr get-login-password --region  | docker login --username AWS --password-stdin 

# Create ECR repository if it does not exist
echo " Creating ECR repository..."
aws ecr create-repository --repository-name  --region  2>/dev/null || echo "Repository already exists"

# Build and push backend image
echo " Building backend image..."
docker build -t -backend -f deployment/docker/Dockerfile.backend .
docker tag -backend:latest /-backend:latest
docker push /-backend:latest

# Build and push frontend image
echo " Building frontend image..."
docker build -t -frontend -f deployment/docker/Dockerfile.frontend .
docker tag -frontend:latest /-frontend:latest
docker push /-frontend:latest

echo " Images pushed to ECR successfully!"
echo ""
echo " ECR Image URLs:"
echo "   Backend: /-backend:latest"
echo "   Frontend: /-frontend:latest"
echo ""
echo " ECR deployment completed!"
echo ""
echo " Next steps:"
echo "1. Deploy to EC2 using the ECR images"
echo "2. Run: ./deploy-ec2-from-ecr.sh"
echo ""
