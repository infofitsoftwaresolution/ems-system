#!/bin/bash

# Rural Samridhi EMS - EC2 Deployment Script with RDS
# This script deploys the application to EC2 with RDS PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/ems-deployment"
GITHUB_REPO="https://github.com/infofitsoftwaresolution/ems-system.git"
EC2_HOST="13.233.73.43"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker service."
    fi
    
    success "All prerequisites met"
}

# Function to setup application directory
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create directory if it doesn't exist
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    cd "$APP_DIR"
    
    # Clone or update repository
    if [ -d ".git" ]; then
        log "Repository exists, pulling latest changes..."
        git pull origin main || warning "Failed to pull latest changes"
    else
        log "Cloning repository..."
        git clone "$GITHUB_REPO" .
    fi
    
    success "Application directory setup complete"
}

# Function to setup environment file
setup_environment() {
    log "Setting up environment configuration..."
    
    cd "$APP_DIR"
    
    # Create .env file with RDS configuration
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.rsamriddhi.com

# RDS PostgreSQL Database Configuration
POSTGRES_HOST=rsamriddhi.c3ea24kmsrmf.ap-south-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=rsamriddhi
POSTGRES_USER=postgres
POSTGRES_PASSWORD=rsamriddhi1234
POSTGRES_SSL=true
DB_DIALECT=postgres
DB_HOST=rsamriddhi.c3ea24kmsrmf.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=rsamriddhi
DB_USER=postgres
DB_PASS=rsamriddhi1234
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-ems-2024-production-change-this
JWT_EXPIRES_IN=24h

# Email Configuration
SMTP_USER=s24346379@gmail.com
SMTP_PASS=edufxpcbkumsnsyo

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
DEBUG=false
ENABLE_REQUEST_LOGGING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Docker Images (will be set by CI/CD)
BACKEND_IMAGE=ghcr.io/infofitsoftwaresolution/ems-system-backend:latest
FRONTEND_IMAGE=ghcr.io/infofitsoftwaresolution/ems-system-frontend:latest
ENVEOF
    
    success "Environment configuration created"
}

# Function to create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    cd "$APP_DIR"
    mkdir -p backend/uploads backend/logs
    mkdir -p ssl-certs
    
    success "Directories created"
}

# Function to login to GitHub Container Registry
login_to_ghcr() {
    log "Logging in to GitHub Container Registry..."
    
    # Check if GITHUB_TOKEN is set
    if [ -z "$GITHUB_TOKEN" ]; then
        warning "GITHUB_TOKEN not set. You may need to login manually."
        warning "Run: echo 'YOUR_TOKEN' | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
        return
    fi
    
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin || warning "Failed to login to GHCR"
}

# Function to pull Docker images
pull_images() {
    log "Pulling latest Docker images..."
    
    cd "$APP_DIR"
    docker-compose -f docker-compose.production.yml pull || warning "Failed to pull some images"
    
    success "Images pulled"
}

# Function to deploy application
deploy_application() {
    log "Deploying application..."
    
    cd "$APP_DIR"
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f docker-compose.production.yml down || true
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f docker-compose.production.yml up -d
    
    success "Application deployed"
}

# Function to wait for services
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            success "Backend health check passed!"
            return 0
        fi
        attempt=$((attempt + 1))
        log "Health check attempt $attempt/$max_attempts..."
        sleep 5
    done
    
    warning "Health check failed after $max_attempts attempts"
    return 1
}

# Function to show deployment status
show_status() {
    log "Deployment Status:"
    echo "=================="
    
    cd "$APP_DIR"
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    log "Container logs (last 20 lines):"
    docker-compose -f docker-compose.production.yml logs --tail=20
}

# Function to cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    
    docker image prune -af --filter "until=24h" || true
    
    success "Cleanup complete"
}

# Main deployment function
main() {
    log "Starting deployment to EC2 with RDS..."
    echo "======================================"
    
    check_prerequisites
    setup_app_directory
    setup_environment
    create_directories
    login_to_ghcr
    pull_images
    deploy_application
    
    # Wait for services
    if wait_for_services; then
        success "All services are healthy!"
    else
        warning "Some services may not be healthy. Check logs for details."
    fi
    
    cleanup
    show_status
    
    success "Deployment completed!"
    log "Application should be available at: http://$EC2_HOST"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        show_status
        ;;
    "logs")
        cd "$APP_DIR"
        docker-compose -f docker-compose.production.yml logs -f
        ;;
    "restart")
        cd "$APP_DIR"
        docker-compose -f docker-compose.production.yml restart
        ;;
    "stop")
        cd "$APP_DIR"
        docker-compose -f docker-compose.production.yml down
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|restart|stop|cleanup}"
        exit 1
        ;;
esac

