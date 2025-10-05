#!/bin/bash

# Rural Samridhi EMS - Production Deployment Script
# This script deploys the EMS application to EC2 with proper configuration

set -e  # Exit on any error

echo "🚀 Starting Rural Samridhi EMS Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Clean up old images (optional)
print_status "Cleaning up old images..."
docker system prune -f || true

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads
mkdir -p data
mkdir -p logs

# Set proper permissions
chmod 755 uploads
chmod 755 data
chmod 755 logs

# Create environment file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating environment file..."
    cat > backend/.env << EOF
# Rural Samridhi EMS - Production Environment Configuration

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3001
NODE_ENV=production

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# ===========================================
# JWT AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-ems-2024-production
JWT_EXPIRES_IN=24h

# ===========================================
# EMAIL CONFIGURATION (Gmail)
# ===========================================
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# ===========================================
# CORS CONFIGURATION
# ===========================================
FRONTEND_URL=http://localhost:80

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===========================================
# LOGGING CONFIGURATION
# ===========================================
LOG_LEVEL=info

# ===========================================
# PRODUCTION SETTINGS
# ===========================================
DEBUG=false
ENABLE_REQUEST_LOGGING=false
EOF
    print_success "Environment file created"
else
    print_status "Environment file already exists"
fi

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.production.yml up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend service is healthy"
else
    print_warning "Backend service may not be ready yet"
fi

# Check frontend
if curl -f http://localhost:80 > /dev/null 2>&1; then
    print_success "Frontend service is healthy"
else
    print_warning "Frontend service may not be ready yet"
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.production.yml ps

# Show logs
print_status "Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=20

print_success "🎉 Deployment completed successfully!"
print_status "Your EMS application should be available at:"
print_status "  Frontend: http://localhost:80"
print_status "  Backend API: http://localhost:3001/api"
print_status ""
print_status "To view logs: docker-compose -f docker-compose.production.yml logs -f"
print_status "To stop services: docker-compose -f docker-compose.production.yml down"
print_status "To restart services: docker-compose -f docker-compose.production.yml restart"
