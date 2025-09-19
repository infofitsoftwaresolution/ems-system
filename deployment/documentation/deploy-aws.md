# AWS Deployment Guide for Employee Management System

This guide will help you deploy your Employee Management System to AWS using ECS Fargate, RDS PostgreSQL, and Application Load Balancer.

## 🏗️ Architecture Overview

```
Internet → ALB → ECS Fargate (Frontend + Backend) → RDS PostgreSQL
```

### Components:
- **Frontend**: React app served by Nginx
- **Backend**: Node.js API with Express
- **Database**: PostgreSQL on RDS
- **Load Balancer**: Application Load Balancer with HTTPS
- **Container Registry**: Amazon ECR
- **Secrets**: AWS Secrets Manager
- **Logging**: CloudWatch Logs

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed
4. **Terraform** installed (optional, for infrastructure as code)
5. **Domain name** (optional, for custom domain)

## 🚀 Quick Deployment (Using Script)

### Step 1: Configure AWS CLI
```bash
aws configure
```

### Step 2: Set Environment Variables
```bash
export DB_PASSWORD="your-strong-db-password"
export JWT_SECRET="your-super-secret-jwt-key"
```

### Step 3: Run Deployment Script
```bash
chmod +x aws-deploy.sh
./aws-deploy.sh
```

## 🏗️ Manual Deployment (Step by Step)

### Step 1: Create ECR Repositories

```bash
# Create repositories
aws ecr create-repository --repository-name ems-backend --region us-east-1
aws ecr create-repository --repository-name ems-frontend --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build and Push Docker Images

```bash
# Build backend
docker build -t ems-backend -f Dockerfile .
docker tag ems-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest

# Build frontend
docker build -t ems-frontend -f Dockerfile.frontend .
docker tag ems-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/ems-frontend:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/ems-frontend:latest
```

### Step 3: Create RDS Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name ems-db-subnet-group \
  --db-subnet-group-description "EMS Database Subnet Group" \
  --subnet-ids subnet-12345678 subnet-87654321

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier ems-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password your-strong-password \
  --allocated-storage 20 \
  --db-name employee_management \
  --db-subnet-group-name ems-db-subnet-group \
  --vpc-security-group-ids sg-12345678
```

### Step 4: Create ECS Cluster and Service

```bash
# Create cluster
aws ecs create-cluster --cluster-name ems-cluster

# Create task definition (see task-definition.json)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster ems-cluster \
  --service-name ems-service \
  --task-definition ems-task:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=ENABLED}"
```

## 🏗️ Infrastructure as Code (Terraform)

### Step 1: Initialize Terraform
```bash
cd terraform
terraform init
```

### Step 2: Configure Variables
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### Step 3: Deploy Infrastructure
```bash
terraform plan
terraform apply
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for local development:

```env
# Database
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=employee_management
DB_USER=postgres
DB_PASSWORD=your-strong-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (if using SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password

# Frontend URL
CLIENT_ORIGIN=https://your-domain.com
```

### Update Frontend API URL

In `employee-management/src/services/api.js`, update the API base URL:

```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-domain.com/api';
```

## 🔒 Security Considerations

1. **Database Security**:
   - Use strong passwords
   - Enable encryption at rest
   - Use private subnets
   - Restrict access with security groups

2. **Application Security**:
   - Use HTTPS
   - Implement proper CORS
   - Use environment variables for secrets
   - Enable CloudWatch logging

3. **Network Security**:
   - Use VPC with private subnets
   - Implement security groups
   - Use Application Load Balancer

## 📊 Monitoring and Logging

### CloudWatch Logs
```bash
# View application logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/ems-task"

# Get log events
aws logs get-log-events --log-group-name "/ecs/ems-task" --log-stream-name "ecs/backend/container-id"
```

### Health Checks
- Backend: `GET /api/health`
- Frontend: `GET /`
- Database: Connection test

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/ems-backend:${{ github.sha }} -f Dockerfile .
          docker build -t $ECR_REGISTRY/ems-frontend:${{ github.sha }} -f Dockerfile.frontend .
          docker push $ECR_REGISTRY/ems-backend:${{ github.sha }}
          docker push $ECR_REGISTRY/ems-frontend:${{ github.sha }}
      
      - name: Update ECS service
        run: |
          aws ecs update-service --cluster ems-cluster --service ems-service --force-new-deployment
```

## 🧹 Cleanup

### Remove All Resources
```bash
# If using Terraform
terraform destroy

# If using manual deployment
aws ecs delete-service --cluster ems-cluster --service ems-service --force
aws ecs delete-cluster --cluster ems-cluster
aws rds delete-db-instance --db-instance-identifier ems-db --skip-final-snapshot
aws ecr delete-repository --repository-name ems-backend --force
aws ecr delete-repository --repository-name ems-frontend --force
```

## 📞 Support

If you encounter issues:

1. Check CloudWatch logs
2. Verify security group rules
3. Test database connectivity
4. Check ECS task status
5. Verify environment variables

## 🎯 Next Steps

1. **Domain and SSL**: Set up custom domain with SSL certificate
2. **Monitoring**: Add CloudWatch alarms and dashboards
3. **Backup**: Configure automated database backups
4. **Scaling**: Set up auto-scaling policies
5. **CDN**: Add CloudFront for static assets












