# 🚀 EMS Latest Version Deployment Guide

## 📋 Overview

This guide will help you update your existing AWS deployment with the latest version of your EMS application using Docker, ECR, and EC2.

## 🎯 What's New in Latest Version

### ✅ **Frontend Improvements:**
- **Clean Project Structure** - Moved from `frontend/Modern-EMS/` to `frontend/`
- **Updated Dependencies** - React 19, latest UI components
- **Enhanced UI/UX** - Better user experience and responsive design
- **New Features** - Admin leave management, improved payslip system
- **Bug Fixes** - Fixed date display issues, improved error handling

### ✅ **Backend Improvements:**
- **Clean Codebase** - Removed temporary files and test scripts
- **Enhanced APIs** - Improved leave management, payslip generation
- **Better Error Handling** - More robust error responses
- **Database Optimizations** - Improved data handling and validation

### ✅ **Deployment Improvements:**
- **Updated Dockerfiles** - Fixed paths for new structure
- **Better Health Checks** - Improved container monitoring
- **Optimized Images** - Smaller, more efficient containers

---

## 🛠️ Prerequisites

### **Required Tools:**
- ✅ **AWS CLI** - Configured with appropriate permissions
- ✅ **Docker** - For building and pushing images
- ✅ **SSH Access** - To your EC2 instance
- ✅ **ECR Repositories** - Backend and frontend repositories

### **AWS Permissions Required:**
- ✅ **ECR** - Push/pull images
- ✅ **EC2** - SSH access to instance
- ✅ **IAM** - ECR authentication

---

## 🚀 Deployment Methods

### **Method 1: Automated Script (Recommended)**

#### **For Linux/Mac:**
```bash
# Make script executable
chmod +x deployment/scripts/deploy-latest-version.sh

# Run deployment
./deployment/scripts/deploy-latest-version.sh
```

#### **For Windows (PowerShell):**
```powershell
# Run PowerShell script
.\deployment\scripts\deploy-latest-version.ps1
```

### **Method 2: Manual Step-by-Step**

#### **Step 1: Prepare Environment**
```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Set your ECR repository names
export ECR_REPOSITORY_BACKEND=ems-backend
export ECR_REPOSITORY_FRONTEND=ems-frontend

# Set your EC2 details
export EC2_HOST=your-ec2-public-ip
export EC2_USER=ec2-user
```

#### **Step 2: Login to ECR**
```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
docker login --username AWS --password-stdin \
$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

#### **Step 3: Build and Push Backend**
```bash
# Build backend image
docker build -f deployment/docker/Dockerfile.backend \
  -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_BACKEND:latest .

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_BACKEND:latest
```

#### **Step 4: Build and Push Frontend**
```bash
# Build frontend image
docker build -f deployment/docker/Dockerfile.frontend \
  -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_FRONTEND:latest .

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_FRONTEND:latest
```

#### **Step 5: Update EC2 Deployment**
```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/ems-key.pem ec2-user@your-ec2-public-ip

# Login to ECR on EC2
aws ecr get-login-password --region $AWS_REGION | \
docker login --username AWS --password-stdin \
$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Stop existing containers
docker-compose -f /opt/ems/docker-compose.yml down

# Pull latest images
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_BACKEND:latest
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_FRONTEND:latest

# Update docker-compose.yml with new image URLs
# (Copy the updated docker-compose.yml content)

# Start services
docker-compose -f /opt/ems/docker-compose.yml up -d
```

---

## 📝 Configuration Updates

### **Updated Docker Compose Configuration:**

```yaml
version: '3.8'

services:
  backend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ems-backend:latest
    container_name: ems-backend
    environment:
      NODE_ENV: production
      DB_PATH: /app/database.sqlite
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key}
      PORT: 3001
      LOG_LEVEL: ${LOG_LEVEL:-info}
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
    image: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ems-frontend:latest
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
```

---

## 🔍 Verification Steps

### **1. Check Container Status**
```bash
# On your EC2 instance
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                    COMMAND                  CREATED         STATUS         PORTS                    NAMES
abc123def456   ems-backend:latest       "dumb-init -- npm s..."  2 minutes ago   Up 2 minutes   0.0.0.0:3001->3001/tcp   ems-backend
def456ghi789   ems-frontend:latest      "/entrypoint.sh"         2 minutes ago   Up 2 minutes   0.0.0.0:80->80/tcp       ems-frontend
```

### **2. Test Application Health**
```bash
# Test backend health
curl http://your-ec2-public-ip:3001/api/health

# Test frontend
curl http://your-ec2-public-ip/
```

### **3. Check Application Logs**
```bash
# Backend logs
docker logs ems-backend

# Frontend logs
docker logs ems-frontend
```

---

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. Image Build Failures**
```bash
# Check Docker build context
docker build -f deployment/docker/Dockerfile.backend -t test-backend .

# Check for missing files
ls -la frontend/
```

#### **2. ECR Push Failures**
```bash
# Verify ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Check repository permissions
aws ecr describe-repositories --region us-east-1
```

#### **3. EC2 Connection Issues**
```bash
# Test SSH connection
ssh -i ~/.ssh/ems-key.pem ec2-user@your-ec2-public-ip

# Check Docker on EC2
ssh -i ~/.ssh/ems-key.pem ec2-user@your-ec2-public-ip "docker --version"
```

#### **4. Container Startup Issues**
```bash
# Check container logs
docker logs ems-backend
docker logs ems-frontend

# Check container status
docker ps -a
```

---

## 📊 Post-Deployment Checklist

### **✅ Application Features:**
- [ ] **User Login** - Test admin and employee login
- [ ] **Employee Management** - Create, edit, delete employees
- [ ] **KYC Process** - Upload documents, approve/reject
- [ ] **Attendance** - Check-in/check-out functionality
- [ ] **Leave Management** - Apply, approve, reject leaves
- [ ] **Payroll System** - Generate and view payslips
- [ ] **Admin Functions** - All administrative features

### **✅ Performance Checks:**
- [ ] **Page Load Times** - Frontend loads quickly
- [ ] **API Response Times** - Backend APIs respond promptly
- [ ] **Database Performance** - SQLite queries are fast
- [ ] **Memory Usage** - Containers use reasonable memory

### **✅ Security Checks:**
- [ ] **HTTPS/SSL** - If configured, SSL certificates work
- [ ] **Authentication** - JWT tokens work properly
- [ ] **File Uploads** - KYC document uploads work
- [ ] **Data Validation** - Input validation works

---

## 🎉 Success!

Your EMS application has been successfully updated with the latest version! 

### **🌐 Access Your Application:**
- **Frontend:** `http://your-ec2-public-ip`
- **Backend API:** `http://your-ec2-public-ip:3001`
- **Health Check:** `http://your-ec2-public-ip:3001/api/health`

### **📞 Support:**
If you encounter any issues during deployment, check the troubleshooting section above or refer to the main documentation.

---

## 🔄 Future Updates

To update your application in the future:

1. **Make changes** to your codebase
2. **Run the deployment script** again
3. **Verify the update** using the checklist above

The deployment process is now streamlined and can be repeated easily for future updates!
