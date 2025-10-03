#!/bin/bash

# Build and Push Script for EMS
echo "🚀 Building and pushing EMS Docker images to ECR..."

# Set variables
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="777555685730"
ECR_REPOSITORY_BACKEND="ems-backend"
ECR_REPOSITORY_FRONTEND="ems-frontend"

# ECR URLs
ECR_BACKEND_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}:latest"
ECR_FRONTEND_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}:latest"

echo "📦 Building backend image..."
docker build -f deployment/docker/Dockerfile.backend -t ems-backend:latest .

echo "📦 Building frontend image..."
docker build -f deployment/docker/Dockerfile.frontend -t ems-frontend:latest .

echo "🏷️ Tagging images for ECR..."
docker tag ems-backend:latest ${ECR_BACKEND_URL}
docker tag ems-frontend:latest ${ECR_FRONTEND_URL}

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

echo "⬆️ Pushing backend image to ECR..."
docker push ${ECR_BACKEND_URL}

echo "⬆️ Pushing frontend image to ECR..."
docker push ${ECR_FRONTEND_URL}

echo "✅ All images pushed successfully!"
echo "Backend: ${ECR_BACKEND_URL}"
echo "Frontend: ${ECR_FRONTEND_URL}"
