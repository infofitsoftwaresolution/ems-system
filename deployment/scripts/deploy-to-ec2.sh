#!/bin/bash

# EMS Deployment Script for EC2
# This script handles the deployment of the EMS system to EC2 instances

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="/opt/ems-deployment"
BACKUP_DIR="/opt/ems-backups"
LOG_FILE="/var/log/ems-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Function to install dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update package list
    apt-get update -y
    
    # Install required packages
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable docker
        systemctl start docker
        success "Docker installed successfully"
    else
        log "Docker is already installed"
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        success "Docker Compose installed successfully"
    else
        log "Docker Compose is already installed"
    fi
}

# Function to setup deployment directory
setup_deployment_dir() {
    log "Setting up deployment directory..."
    
    # Create deployment directory
    mkdir -p "$DEPLOYMENT_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Create necessary subdirectories
    mkdir -p "$DEPLOYMENT_DIR/uploads/kyc"
    mkdir -p "$DEPLOYMENT_DIR/uploads/payslips"
    mkdir -p "$DEPLOYMENT_DIR/ssl-certs"
    mkdir -p "$DEPLOYMENT_DIR/logs"
    
    # Set permissions
    chown -R www-data:www-data "$DEPLOYMENT_DIR/uploads"
    chmod -R 755 "$DEPLOYMENT_DIR/uploads"
    
    success "Deployment directory setup completed"
}

# Function to clone or update repository
update_repository() {
    log "Updating repository..."
    
    if [ -d "$DEPLOYMENT_DIR/.git" ]; then
        cd "$DEPLOYMENT_DIR"
        git fetch origin
        git reset --hard origin/main
        success "Repository updated"
    else
        git clone https://github.com/infofitsoftwaresolution/ems-system.git "$DEPLOYMENT_DIR"
        success "Repository cloned"
    fi
}

# Function to create environment file
create_env_file() {
    log "Creating environment file..."
    
    cat > "$DEPLOYMENT_DIR/.env" << EOF
# EMS Environment Configuration
NODE_ENV=production
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
DB_PATH=/app/database.sqlite
PORT=3001
LOG_LEVEL=info

# Docker Images
BACKEND_IMAGE=${BACKEND_IMAGE:-ghcr.io/infofitsoftwaresolution/ems-system-backend:latest}
FRONTEND_IMAGE=${FRONTEND_IMAGE:-ghcr.io/infofitsoftwaresolution/ems-system-frontend:latest}

# GitHub Container Registry
GITHUB_TOKEN=${GITHUB_TOKEN}

# SSL Configuration (optional)
SSL_CERT_PATH=${SSL_CERT_PATH:-/etc/ssl/certs/cert.pem}
SSL_KEY_PATH=${SSL_KEY_PATH:-/etc/ssl/certs/key.pem}
EOF
    
    chmod 600 "$DEPLOYMENT_DIR/.env"
    success "Environment file created"
}

# Function to backup current deployment
backup_deployment() {
    log "Creating backup of current deployment..."
    
    if [ -d "$DEPLOYMENT_DIR" ]; then
        BACKUP_NAME="ems-backup-$(date +%Y%m%d-%H%M%S)"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$DEPLOYMENT_DIR" .
        success "Backup created: $BACKUP_NAME.tar.gz"
    fi
}

# Function to deploy application
deploy_application() {
    log "Deploying application..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Login to GitHub Container Registry
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
    fi
    
    # Pull latest images
    docker-compose pull
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        success "Application deployed successfully"
    else
        error "Health check failed"
    fi
}

# Function to cleanup old images
cleanup_images() {
    log "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old images (keep last 3 versions)
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
    grep "ghcr.io/infofitsoftwaresolution/ems-system" | \
    tail -n +4 | \
    awk '{print $1}' | \
    xargs -r docker rmi
    
    success "Cleanup completed"
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create systemd service for monitoring
    cat > /etc/systemd/system/ems-monitor.service << EOF
[Unit]
Description=EMS System Monitor
After=docker.service
Requires=docker.service

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do if ! curl -f http://localhost/api/health >/dev/null 2>&1; then echo "Health check failed at $(date)" >> /var/log/ems-monitor.log; fi; sleep 60; done'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable ems-monitor
    systemctl start ems-monitor
    
    success "Monitoring setup completed"
}

# Function to setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > /etc/logrotate.d/ems << EOF
/var/log/ems-deployment.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}

/var/log/ems-monitor.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
    
    success "Log rotation setup completed"
}

# Function to show deployment status
show_status() {
    log "Deployment Status:"
    echo "=================="
    
    # Docker containers status
    echo "Docker Containers:"
    docker-compose -f "$DEPLOYMENT_DIR/docker-compose.yml" ps
    
    # Service health
    echo -e "\nService Health:"
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend API: Healthy${NC}"
    else
        echo -e "${RED}✗ Backend API: Unhealthy${NC}"
    fi
    
    if curl -f http://localhost/ >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend: Healthy${NC}"
    else
        echo -e "${RED}✗ Frontend: Unhealthy${NC}"
    fi
    
    # Disk usage
    echo -e "\nDisk Usage:"
    df -h "$DEPLOYMENT_DIR"
    
    # Memory usage
    echo -e "\nMemory Usage:"
    free -h
}

# Main deployment function
main() {
    log "Starting EMS deployment..."
    
    check_root
    install_dependencies
    setup_deployment_dir
    backup_deployment
    update_repository
    create_env_file
    deploy_application
    cleanup_images
    setup_monitoring
    setup_log_rotation
    
    success "EMS deployment completed successfully!"
    show_status
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        show_status
        ;;
    "backup")
        backup_deployment
        ;;
    "cleanup")
        cleanup_images
        ;;
    "restart")
        cd "$DEPLOYMENT_DIR"
        docker-compose restart
        ;;
    "logs")
        cd "$DEPLOYMENT_DIR"
        docker-compose logs -f
        ;;
    *)
        echo "Usage: $0 {deploy|status|backup|cleanup|restart|logs}"
        exit 1
        ;;
esac