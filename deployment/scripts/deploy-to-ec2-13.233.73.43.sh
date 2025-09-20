#!/bin/bash

echo " Starting EMS Deployment on EC2 Instance 13.233.73.43..."

# Set AWS region and account details
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="777555685730"
ECR_REGISTRY=".dkr.ecr..amazonaws.com"
EC2_IP="13.233.73.43"

echo " Configuration:"
echo "   AWS Region: "
echo "   Account ID: "
echo "   ECR Registry: "
echo "   EC2 IP: "

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo " AWS CLI is not installed. Please install it first."
    exit 1
fi

echo " Prerequisites check passed!"

# Set environment variables
export DB_PASSWORD=
export JWT_SECRET=
export BACKEND_URL=

echo " Environment variables set:"
echo "   DB_PASSWORD: [HIDDEN]"
echo "   JWT_SECRET: [HIDDEN]"
echo "   BACKEND_URL: "

# Create deployment script for EC2
cat > deploy-to-ec2.sh << 'EOF'
#!/bin/bash

echo " Setting up EMS on EC2 Instance..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
echo " Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
echo " Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose--" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
echo " Installing AWS CLI..."
sudo apt install awscli -y

# Install curl for health checks
sudo apt install curl -y

echo " Prerequisites installed successfully!"

# Set environment variables
export DB_PASSWORD="ems_secure_password_2024"
export JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
export BACKEND_URL="http://13.233.73.43:3001"

# Create application directory
mkdir -p ems-deployment
cd ems-deployment

# Create docker-compose file
cat > docker-compose-ecr.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ems-postgres
    environment:
      POSTGRES_DB: employee_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ems_secure_password_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API from ECR
  backend:
    image: 777555685730.dkr.ecr.ap-south-1.amazonaws.com/employee-management-system-backend:latest
    container_name: ems-backend
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: employee_management
      DB_USER: postgres
      DB_PASSWORD: ems_secure_password_2024
      JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  # Frontend React App from ECR
  frontend:
    image: 777555685730.dkr.ecr.ap-south-1.amazonaws.com/employee-management-system-frontend:latest
    container_name: ems-frontend
    environment:
      BACKEND_URL: http://13.233.73.43:3001
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
COMPOSE_EOF

echo " Created docker-compose-ecr.yml file"

# Create uploads directory
mkdir -p uploads/kyc uploads/payslips

# Login to ECR
echo " Logging in to ECR..."
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 777555685730.dkr.ecr.ap-south-1.amazonaws.com

# Pull latest images from ECR
echo " Pulling latest images from ECR..."
docker pull 777555685730.dkr.ecr.ap-south-1.amazonaws.com/employee-management-system-backend:latest
docker pull 777555685730.dkr.ecr.ap-south-1.amazonaws.com/employee-management-system-frontend:latest

# Stop any existing containers
echo " Stopping existing containers..."
docker-compose -f docker-compose-ecr.yml down

# Start services
echo " Starting services..."
docker-compose -f docker-compose-ecr.yml up -d

# Wait for services to be ready
echo " Waiting for services to be ready..."
sleep 30

# Check service status
echo " Checking service status..."
docker-compose -f docker-compose-ecr.yml ps

# Test backend health
echo " Testing backend health..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo " Backend is healthy"
else
    echo " Backend health check failed"
fi

# Test frontend
echo " Testing frontend..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo " Frontend is accessible"
else
    echo " Frontend is not accessible"
fi

echo ""
echo " Deployment completed!"
echo ""
echo " Service URLs:"
echo "   Frontend: http://13.233.73.43"
echo "   Backend API: http://13.233.73.43:3001"
echo "   Database: localhost:5432"
echo ""
echo " Useful commands:"
echo "   View logs: docker-compose -f docker-compose-ecr.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose-ecr.yml down"
echo "   Restart services: docker-compose -f docker-compose-ecr.yml restart"
echo "   Update services: docker-compose -f docker-compose-ecr.yml pull && docker-compose -f docker-compose-ecr.yml up -d"
echo ""

EOF

echo " Created deployment script for EC2"

# Make the script executable
chmod +x deploy-to-ec2.sh

echo ""
echo " Next Steps:"
echo "1. Copy the deployment script to your EC2 instance:"
echo "   scp -i your-key.pem deploy-to-ec2.sh ubuntu@13.233.73.43:~/"
echo ""
echo "2. Connect to your EC2 instance:"
echo "   ssh -i your-key.pem ubuntu@13.233.73.43"
echo ""
echo "3. Run the deployment script:"
echo "   chmod +x deploy-to-ec2.sh"
echo "   ./deploy-to-ec2.sh"
echo ""
echo "4. Configure AWS credentials on EC2 (if not already done):"
echo "   aws configure"
echo "   # Enter your AWS Access Key ID, Secret Access Key, and region (ap-south-1)"
echo ""
echo " Your application will be available at:"
echo "   Frontend: http://13.233.73.43"
echo "   Backend API: http://13.233.73.43:3001"
echo ""
