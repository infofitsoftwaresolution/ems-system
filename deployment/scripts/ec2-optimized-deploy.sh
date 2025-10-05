#!/bin/bash

# Optimized EC2 Deployment Script for EMS
# This script provides a comprehensive deployment solution for EC2

set -e

# Configuration
PROJECT_NAME="ems-system"
DEPLOYMENT_DIR="/opt/ems-deployment"
LOG_FILE="/var/log/ems-deployment.log"
BACKUP_DIR="/opt/ems-backups"

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

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please run the EC2 setup script first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please run the EC2 setup script first."
    fi
    
    # Check available disk space (minimum 5GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then # 5GB in KB
        warning "Low disk space. Available: $(df -h / | awk 'NR==2 {print $4}')"
    fi
    
    success "Prerequisites check completed"
}

# Function to create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    # Backup current deployment if it exists
    if [ -d "$DEPLOYMENT_DIR" ]; then
        log "Backing up existing deployment..."
        cp -r "$DEPLOYMENT_DIR" "$BACKUP_PATH"
        success "Backup created at $BACKUP_PATH"
    else
        log "No existing deployment found, skipping backup"
    fi
}

# Function to setup environment
setup_environment() {
    log "Setting up environment..."
    
    # Create deployment directory
    mkdir -p "$DEPLOYMENT_DIR"
    cd "$DEPLOYMENT_DIR"
    
    # Create environment file
    cat > .env << EOF
# EMS Environment Configuration
NODE_ENV=production
BACKEND_IMAGE=ghcr.io/infofitsoftwaresolution/ems-system-backend:latest
FRONTEND_IMAGE=ghcr.io/infofitsoftwaresolution/ems-system-frontend:latest

# Database Configuration
DB_PATH=/app/database.sqlite

# JWT Configuration
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}

# Logging
LOG_LEVEL=info

# SSL Configuration (set to true for HTTPS)
SSL_ENABLED=false
SSL_CERT_PATH=/etc/ssl/certs/ems.crt
SSL_KEY_PATH=/etc/ssl/private/ems.key

# Security
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (optional)
EMAIL_SERVICE=${EMAIL_SERVICE:-}
EMAIL_USER=${EMAIL_USER:-}
EMAIL_PASS=${EMAIL_PASS:-}
EMAIL_FROM=${EMAIL_FROM:-noreply@ems.com}

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7
EOF

    success "Environment configuration created"
}

# Function to pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    # Pull backend image
    log "Pulling backend image..."
    docker pull ghcr.io/infofitsoftwaresolution/ems-system-backend:latest || {
        warning "Failed to pull backend image, using local build"
    }
    
    # Pull frontend image
    log "Pulling frontend image..."
    docker pull ghcr.io/infofitsoftwaresolution/ems-system-frontend:latest || {
        warning "Failed to pull frontend image, using local build"
    }
    
    success "Images pulled successfully"
}

# Function to create optimized docker-compose
create_docker_compose() {
    log "Creating optimized docker-compose configuration..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Backend API
  backend:
    image: ${BACKEND_IMAGE:-ghcr.io/infofitsoftwaresolution/ems-system-backend:latest}
    container_name: ems-backend
    environment:
      NODE_ENV: production
      DB_PATH: /app/database.sqlite
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
      LOG_LEVEL: ${LOG_LEVEL:-info}
      CORS_ORIGIN: ${CORS_ORIGIN:-*}
    ports:
      - "3001:3001"
    volumes:
      - uploads_data:/app/uploads
      - database_data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
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
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Frontend React App
  frontend:
    image: ${FRONTEND_IMAGE:-ghcr.io/infofitsoftwaresolution/ems-system-frontend:latest}
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
      - ./logs/nginx:/var/log/nginx
    restart: unless-stopped
    networks:
      - app-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.25'
        reservations:
          memory: 256M
          cpus: '0.1'
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Database backup service
  backup:
    image: alpine:latest
    container_name: ems-backup
    volumes:
      - database_data:/backup/database
      - ./backups:/backup/output
    command: |
      sh -c '
        while true; do
          echo "Creating database backup..."
          tar -czf /backup/output/db_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /backup database.sqlite
          find /backup/output -name "db_backup_*.tar.gz" -mtime +7 -delete
          sleep 86400
        done
      '
    restart: unless-stopped
    networks:
      - app-network
    profiles:
      - production

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
        - subnet: 172.20.0.0/16
EOF

    success "Docker Compose configuration created"
}

# Function to create nginx configuration
create_nginx_config() {
    log "Creating Nginx configuration..."
    
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Upstream backend
    upstream backend {
        server backend:3001;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Frontend routes
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

    success "Nginx configuration created"
}

# Function to setup SSL (optional)
setup_ssl() {
    if [ "${SSL_ENABLED:-false}" = "true" ]; then
        log "Setting up SSL certificates..."
        
        mkdir -p ssl-certs
        
        # Generate self-signed certificate for development
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl-certs/ems.key \
            -out ssl-certs/ems.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        chmod 600 ssl-certs/ems.key
        chmod 644 ssl-certs/ems.crt
        
        success "SSL certificates generated"
    else
        log "SSL disabled, skipping certificate setup"
    fi
}

# Function to start services
start_services() {
    log "Starting EMS services..."
    
    # Stop existing services
    docker-compose down --remove-orphans || true
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to start..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "Up"; then
        success "Services started successfully"
    else
        error "Failed to start services"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash

# EMS Monitoring Script
LOG_FILE="/var/log/ems-monitor.log"

echo "=== EMS System Status $(date) ===" >> "$LOG_FILE"

# Check Docker services
echo "Docker Services:" >> "$LOG_FILE"
docker-compose ps >> "$LOG_FILE"

# Check system resources
echo "System Resources:" >> "$LOG_FILE"
echo "CPU Usage:" >> "$LOG_FILE"
top -bn1 | grep "Cpu(s)" >> "$LOG_FILE"
echo "Memory Usage:" >> "$LOG_FILE"
free -h >> "$LOG_FILE"
echo "Disk Usage:" >> "$LOG_FILE"
df -h >> "$LOG_FILE"

# Check application health
echo "Application Health:" >> "$LOG_FILE"
curl -s http://localhost/api/health >> "$LOG_FILE" 2>&1 || echo "Health check failed" >> "$LOG_FILE"

echo "================================" >> "$LOG_FILE"
EOF

    chmod +x monitor.sh
    
    # Add to crontab (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * cd $DEPLOYMENT_DIR && ./monitor.sh") | crontab -
    
    success "Monitoring setup completed"
}

# Function to show deployment status
show_status() {
    log "Deployment Status:"
    echo "=================="
    
    echo "Services Status:"
    docker-compose ps
    
    echo -e "\nSystem Resources:"
    echo "CPU: $(nproc) cores"
    echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
    echo "Disk: $(df -h / | awk 'NR==2 {print $2}')"
    
    echo -e "\nApplication URLs:"
    echo "Frontend: http://$(curl -s ifconfig.me)"
    echo "Backend API: http://$(curl -s ifconfig.me):3001"
    echo "Health Check: http://$(curl -s ifconfig.me)/health"
    
    echo -e "\nLogs:"
    echo "Application logs: docker-compose logs"
    echo "System logs: $LOG_FILE"
    echo "Monitoring logs: /var/log/ems-monitor.log"
}

# Function to cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Remove backups older than 7 days
    find "$BACKUP_DIR" -name "backup_*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    success "Old backups cleaned up"
}

# Main deployment function
main() {
    log "Starting optimized EMS deployment on EC2..."
    
    check_prerequisites
    create_backup
    setup_environment
    pull_images
    create_docker_compose
    create_nginx_config
    setup_ssl
    start_services
    setup_monitoring
    cleanup_backups
    
    success "EMS deployment completed successfully!"
    show_status
    
    log "Next steps:"
    echo "1. Access your application at http://$(curl -s ifconfig.me)"
    echo "2. Check logs with: docker-compose logs"
    echo "3. Monitor system with: ./monitor.sh"
    echo "4. Backup data is stored in: $BACKUP_DIR"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        show_status
        ;;
    "restart")
        log "Restarting services..."
        docker-compose restart
        success "Services restarted"
        ;;
    "stop")
        log "Stopping services..."
        docker-compose down
        success "Services stopped"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "backup")
        create_backup
        ;;
    "cleanup")
        cleanup_backups
        ;;
    *)
        echo "Usage: $0 {deploy|status|restart|stop|logs|backup|cleanup}"
        exit 1
        ;;
esac

