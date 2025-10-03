#!/bin/bash

# ===========================================
# EMS Latest Version Deployment Script
# ===========================================
# This script updates your existing AWS deployment
# with the latest version of the EMS application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY_BACKEND=${ECR_REPOSITORY_BACKEND:-ems-backend}
ECR_REPOSITORY_FRONTEND=${ECR_REPOSITORY_FRONTEND:-ems-frontend}
EC2_INSTANCE_ID=${EC2_INSTANCE_ID:-}
EC2_USER=${EC2_USER:-ec2-user}
EC2_HOST=${EC2_HOST:-}

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECR URLs
ECR_BACKEND_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_BACKEND}"
ECR_FRONTEND_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_FRONTEND}"

echo -e "${BLUE}🚀 Starting EMS Latest Version Deployment${NC}"
echo -e "${BLUE}===========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Login to ECR
login_to_ecr() {
    echo -e "${BLUE}🔐 Logging into ECR...${NC}"
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
    print_status "ECR login successful"
}

# Build and push backend image
build_and_push_backend() {
    echo -e "${BLUE}🏗️  Building backend image...${NC}"
    
    # Build backend image
    docker build -f deployment/docker/Dockerfile.backend -t ${ECR_BACKEND_URL}:latest .
    
    # Tag for ECR
    docker tag ${ECR_BACKEND_URL}:latest ${ECR_BACKEND_URL}:$(date +%Y%m%d-%H%M%S)
    
    # Push to ECR
    echo -e "${BLUE}📤 Pushing backend image to ECR...${NC}"
    docker push ${ECR_BACKEND_URL}:latest
    docker push ${ECR_BACKEND_URL}:$(date +%Y%m%d-%H%M%S)
    
    print_status "Backend image built and pushed successfully"
}

# Build and push frontend image
build_and_push_frontend() {
    echo -e "${BLUE}🏗️  Building frontend image...${NC}"
    
    # Build frontend image
    docker build -f deployment/docker/Dockerfile.frontend -t ${ECR_FRONTEND_URL}:latest .
    
    # Tag for ECR
    docker tag ${ECR_FRONTEND_URL}:latest ${ECR_FRONTEND_URL}:$(date +%Y%m%d-%H%M%S)
    
    # Push to ECR
    echo -e "${BLUE}📤 Pushing frontend image to ECR...${NC}"
    docker push ${ECR_FRONTEND_URL}:latest
    docker push ${ECR_FRONTEND_URL}:$(date +%Y%m%d-%H%M%S)
    
    print_status "Frontend image built and pushed successfully"
}

# Update EC2 deployment
update_ec2_deployment() {
    if [ -z "$EC2_HOST" ]; then
        print_warning "EC2_HOST not set. Skipping EC2 deployment update."
        return
    fi
    
    echo -e "${BLUE}🔄 Updating EC2 deployment...${NC}"
    
    # Create deployment script for EC2
    cat > /tmp/update-ems.sh << EOF
#!/bin/bash
set -e

echo "🔄 Updating EMS deployment on EC2..."

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Stop existing containers
docker-compose -f /opt/ems/docker-compose.yml down || true

# Pull latest images
docker pull ${ECR_BACKEND_URL}:latest
docker pull ${ECR_FRONTEND_URL}:latest

# Update docker-compose.yml with new image URLs
cat > /opt/ems/docker-compose.yml << 'DOCKER_COMPOSE_EOF'
version: '3.8'

services:
  backend:
    image: ${ECR_BACKEND_URL}:latest
    container_name: ems-backend
    environment:
      NODE_ENV: production
      DB_PATH: /app/database.sqlite
      JWT_SECRET: \${JWT_SECRET:-your-super-secret-jwt-key}
      PORT: 3001
      LOG_LEVEL: \${LOG_LEVEL:-info}
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
    image: ${ECR_FRONTEND_URL}:latest
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
EOF

    # Copy script to EC2 and execute
    scp -i ~/.ssh/ems-key.pem /tmp/update-ems.sh ${EC2_USER}@${EC2_HOST}:/tmp/
    ssh -i ~/.ssh/ems-key.pem ${EC2_USER}@${EC2_HOST} "chmod +x /tmp/update-ems.sh && /tmp/update-ems.sh"
    
    print_status "EC2 deployment updated successfully"
}

# Main deployment function
main() {
    echo -e "${BLUE}🎯 Starting deployment process...${NC}"
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Login to ECR
    login_to_ecr
    
    # Step 3: Build and push backend
    build_and_push_backend
    
    # Step 4: Build and push frontend
    build_and_push_frontend
    
    # Step 5: Update EC2 deployment
    update_ec2_deployment
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${GREEN}✅ Backend Image: ${ECR_BACKEND_URL}:latest${NC}"
    echo -e "${GREEN}✅ Frontend Image: ${ECR_FRONTEND_URL}:latest${NC}"
    echo -e "${BLUE}🌐 Your EMS application should be running on your EC2 instance${NC}"
}

# Run main function
main "$@"
