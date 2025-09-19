#!/bin/bash

# AWS Deployment Script for Employee Management System
# This script deploys the application to AWS using ECS Fargate

set -e

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY_NAME="employee-management-system"
CLUSTER_NAME="ems-cluster"
SERVICE_NAME="ems-service"
TASK_DEFINITION_NAME="ems-task"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting AWS Deployment...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${YELLOW}📋 AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${YELLOW}📋 ECR URI: ${ECR_URI}${NC}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Creating ECR repository...${NC}"
aws ecr create-repository --repository-name ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} || true

# Login to ECR
echo -e "${YELLOW}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}

# Build and push backend image
echo -e "${YELLOW}🏗️  Building backend image...${NC}"
docker build -t ${ECR_REPOSITORY_NAME}-backend -f Dockerfile .
docker tag ${ECR_REPOSITORY_NAME}-backend:latest ${ECR_URI}/${ECR_REPOSITORY_NAME}-backend:latest
docker push ${ECR_URI}/${ECR_REPOSITORY_NAME}-backend:latest

# Build and push frontend image
echo -e "${YELLOW}🏗️  Building frontend image...${NC}"
docker build -t ${ECR_REPOSITORY_NAME}-frontend -f Dockerfile.frontend .
docker tag ${ECR_REPOSITORY_NAME}-frontend:latest ${ECR_URI}/${ECR_REPOSITORY_NAME}-frontend:latest
docker push ${ECR_URI}/${ECR_REPOSITORY_NAME}-frontend:latest

echo -e "${GREEN}✅ Images pushed to ECR successfully!${NC}"

# Create ECS cluster if it doesn't exist
echo -e "${YELLOW}🏗️  Creating ECS cluster...${NC}"
aws ecs create-cluster --cluster-name ${CLUSTER_NAME} --region ${AWS_REGION} || true

# Create task definition
echo -e "${YELLOW}📋 Creating task definition...${NC}"
cat > task-definition.json << EOF
{
  "family": "${TASK_DEFINITION_NAME}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${ECR_URI}/${ECR_REPOSITORY_NAME}-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DB_HOST",
          "value": "your-rds-endpoint"
        },
        {
          "name": "DB_PORT",
          "value": "5432"
        },
        {
          "name": "DB_NAME",
          "value": "employee_management"
        },
        {
          "name": "DB_USER",
          "value": "postgres"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:ems/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:ems/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${TASK_DEFINITION_NAME}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    },
    {
      "name": "frontend",
      "image": "${ECR_URI}/${ECR_REPOSITORY_NAME}-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${TASK_DEFINITION_NAME}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json --region ${AWS_REGION}

echo -e "${GREEN}✅ Task definition registered successfully!${NC}"

# Create CloudWatch log group
echo -e "${YELLOW}📊 Creating CloudWatch log group...${NC}"
aws logs create-log-group --log-group-name "/ecs/${TASK_DEFINITION_NAME}" --region ${AWS_REGION} || true

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "1. Set up RDS PostgreSQL database"
echo -e "2. Configure secrets in AWS Secrets Manager"
echo -e "3. Create Application Load Balancer"
echo -e "4. Create ECS service with the task definition"
echo -e "5. Configure domain and SSL certificate"

# Clean up
rm -f task-definition.json

echo -e "${GREEN}✨ Deployment script completed!${NC}"












