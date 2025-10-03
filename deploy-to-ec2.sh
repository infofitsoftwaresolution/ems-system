#!/bin/bash

# EC2 Deployment Script for EMS
echo "🚀 Deploying EMS to EC2..."

# Set variables
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="777555685730"
ECR_BACKEND_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ems-backend:latest"
ECR_FRONTEND_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ems-frontend:latest"

echo "📦 Creating deployment directory..."
mkdir -p ~/ems-system
cd ~/ems-system

echo "📝 Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ems-postgres
    environment:
      POSTGRES_DB: ems_db
      POSTGRES_USER: ems_user
      POSTGRES_PASSWORD: ems_password
    ports:
      - "5432:5432"
    volumes:
      - database_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - app-network

  # Backend API - Using ECR image
  backend:
    image: 777555685730.dkr.ecr.ap-south-1.amazonaws.com/ems-backend:latest
    container_name: ems-backend
    environment:
      NODE_ENV: production
      JWT_SECRET: your-super-secret-jwt-key-ems-2024
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: ems_db
      POSTGRES_USER: ems_user
      POSTGRES_PASSWORD: ems_password
      POSTGRES_SSL: false
      PORT: 3001
      LOG_LEVEL: info
    ports:
      - "3001:3001"
    volumes:
      - uploads_data:/app/uploads
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_started
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # Frontend React App - Using ECR image
  frontend:
    image: 777555685730.dkr.ecr.ap-south-1.amazonaws.com/ems-frontend:latest
    container_name: ems-frontend
    environment:
      BACKEND_URL: http://13.233.73.43
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_cache:/var/cache/nginx
    restart: unless-stopped
    networks:
      - app-network
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

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
    ipam:
      config:
        - subnet: 172.25.0.0/16
EOF

echo "📝 Creating nginx.conf..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    server {
        listen       80;
        server_name  13.233.73.43 localhost;
        
        # API proxy
        location /api/ {
            proxy_pass http://backend:3001/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
        }
        
        # Frontend
        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

echo "⬇️ Pulling latest images..."
docker pull ${ECR_BACKEND_URL}
docker pull ${ECR_FRONTEND_URL}

echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

echo "🧹 Cleaning up Docker..."
docker system prune -f

echo "🚀 Starting EMS application..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking service status..."
docker ps

echo "✅ Deployment complete!"
echo "🌐 Application should be available at: http://13.233.73.43"
echo "🔧 Backend API: http://13.233.73.43:3001/api"
echo "📊 Health check: http://13.233.73.43:3001/api/health"
