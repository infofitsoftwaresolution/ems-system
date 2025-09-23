#!/bin/bash

# Direct Docker Deployment to EC2
# This script deploys the EMS application directly to EC2 using Docker

set -e  # Exit on any error

# Configuration
EC2_HOST="13.233.73.43"
EC2_USER="ec2-user"
APP_DIR="/home/ec2-user/app"
BACKUP_DIR="/home/ec2-user/backups"

echo "🚀 Starting direct deployment to EC2..."

# Check if SSH key is provided
if [ -z "$SSH_KEY_PATH" ]; then
    echo "❌ Please set SSH_KEY_PATH environment variable"
    echo "Example: export SSH_KEY_PATH=/path/to/your/key.pem"
    exit 1
fi

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at: $SSH_KEY_PATH"
    exit 1
fi

echo "📦 Building Docker images locally..."

# Build backend image
echo "Building backend image..."
docker build -f deployment/docker/Dockerfile.backend -t ems-backend:latest ./backend

# Build frontend image
echo "Building frontend image..."
docker build -f deployment/docker/Dockerfile.frontend.ssl -t ems-frontend:latest .

echo "✅ Docker images built successfully"

# Save Docker images to tar files
echo "💾 Saving Docker images..."
docker save ems-backend:latest | gzip > ems-backend.tar.gz
docker save ems-frontend:latest | gzip > ems-frontend.tar.gz

echo "📤 Uploading files to EC2..."

# Upload Docker images
scp -i "$SSH_KEY_PATH" ems-backend.tar.gz ems-frontend.tar.gz $EC2_USER@$EC2_HOST:/tmp/

# Upload deployment files
scp -i "$SSH_KEY_PATH" deployment/docker/docker-compose.yml $EC2_USER@$EC2_HOST:/tmp/
scp -i "$SSH_KEY_PATH" deployment/docker/nginx.conf $EC2_USER@$EC2_HOST:/tmp/
scp -i "$SSH_KEY_PATH" deployment/docker/entrypoint.sh $EC2_USER@$EC2_HOST:/tmp/

echo "🔧 Setting up application on EC2..."

# Deploy on EC2
ssh -i "$SSH_KEY_PATH" $EC2_USER@$EC2_HOST << 'EOF'
set -e

echo "📁 Setting up directories..."
sudo mkdir -p /home/ec2-user/app
sudo mkdir -p /home/ec2-user/backups
sudo mkdir -p /home/ec2-user/app/uploads/kyc
sudo mkdir -p /home/ec2-user/app/uploads/payslips
sudo mkdir -p /home/ec2-user/app/ssl-certs

echo "🔄 Stopping existing containers..."
cd /home/ec2-user/app
sudo docker-compose down || true

echo "📦 Loading Docker images..."
sudo docker load -i /tmp/ems-backend.tar.gz
sudo docker load -i /tmp/ems-frontend.tar.gz

echo "📋 Copying deployment files..."
sudo cp /tmp/docker-compose.yml /home/ec2-user/app/
sudo cp /tmp/nginx.conf /home/ec2-user/app/
sudo cp /tmp/entrypoint.sh /home/ec2-user/app/
sudo chmod +x /home/ec2-user/app/entrypoint.sh

echo "🔧 Setting up environment..."
cat > /home/ec2-user/app/.env << 'ENVEOF'
NODE_ENV=production
DB_PATH=/app/database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
BACKEND_URL=http://backend:3001
SSL_ENABLED=false
ENVEOF

echo "🚀 Starting application..."
cd /home/ec2-user/app
sudo docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking service status..."
sudo docker-compose ps

echo "🏥 Running health checks..."
# Check backend health
if curl -f http://localhost:3001/api/health; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    sudo docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    sudo docker-compose logs frontend
    exit 1
fi

echo "🧹 Cleaning up temporary files..."
rm -f /tmp/ems-backend.tar.gz /tmp/ems-frontend.tar.gz /tmp/docker-compose.yml /tmp/nginx.conf /tmp/entrypoint.sh

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is now running at:"
echo "   Frontend: http://13.233.73.43"
echo "   Backend API: http://13.233.73.43:3001/api"
echo "   Health Check: http://13.233.73.43:3001/api/health"
EOF

# Clean up local files
echo "🧹 Cleaning up local files..."
rm -f ems-backend.tar.gz ems-frontend.tar.gz

echo "🎉 Deployment completed successfully!"
echo "🌐 Your application is now running at:"
echo "   Frontend: http://13.233.73.43"
echo "   Backend API: http://13.233.73.43:3001/api"
echo "   Health Check: http://13.233.73.43:3001/api/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST 'cd /home/ec2-user/app && sudo docker-compose logs'"
echo "   Restart: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST 'cd /home/ec2-user/app && sudo docker-compose restart'"
echo "   Stop: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST 'cd /home/ec2-user/app && sudo docker-compose down'"
