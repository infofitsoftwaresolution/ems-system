#!/bin/bash

# EMS Backup Script
# This script creates backups of the EMS system data and configuration

set -e

# Configuration
BACKUP_DIR="/opt/ems-backups"
DEPLOYMENT_DIR="/opt/ems-deployment"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="ems-backup-$DATE"
LOG_FILE="/var/log/ems-backup.log"

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

# Function to create backup directory
create_backup_dir() {
    log "Creating backup directory..."
    
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/database"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/uploads"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/config"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/logs"
    
    success "Backup directory created: $BACKUP_DIR/$BACKUP_NAME"
}

# Function to backup database
backup_database() {
    log "Backing up database..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Check if database container is running
    if docker-compose ps | grep -q "ems-backend.*Up"; then
        # Copy database from container
        docker-compose exec -T backend cp /app/database.sqlite /tmp/database.sqlite
        docker cp ems-backend:/tmp/database.sqlite "$BACKUP_DIR/$BACKUP_NAME/database/"
        
        # Also backup any PostgreSQL data if using PostgreSQL
        if docker-compose ps | grep -q "postgres.*Up"; then
            docker-compose exec -T postgres pg_dump -U postgres ems_db > "$BACKUP_DIR/$BACKUP_NAME/database/postgres_backup.sql"
        fi
        
        success "Database backup completed"
    else
        warning "Backend container is not running, skipping database backup"
    fi
}

# Function to backup uploads
backup_uploads() {
    log "Backing up uploads..."
    
    if [ -d "$DEPLOYMENT_DIR/uploads" ]; then
        cp -r "$DEPLOYMENT_DIR/uploads"/* "$BACKUP_DIR/$BACKUP_NAME/uploads/" 2>/dev/null || true
        success "Uploads backup completed"
    else
        warning "Uploads directory not found"
    fi
}

# Function to backup configuration
backup_config() {
    log "Backing up configuration..."
    
    # Backup environment file
    if [ -f "$DEPLOYMENT_DIR/.env" ]; then
        cp "$DEPLOYMENT_DIR/.env" "$BACKUP_DIR/$BACKUP_NAME/config/"
    fi
    
    # Backup docker-compose file
    if [ -f "$DEPLOYMENT_DIR/docker-compose.yml" ]; then
        cp "$DEPLOYMENT_DIR/docker-compose.yml" "$BACKUP_DIR/$BACKUP_NAME/config/"
    fi
    
    # Backup nginx configuration
    if [ -f "$DEPLOYMENT_DIR/nginx.conf" ]; then
        cp "$DEPLOYMENT_DIR/nginx.conf" "$BACKUP_DIR/$BACKUP_NAME/config/"
    fi
    
    # Backup SSL certificates
    if [ -d "$DEPLOYMENT_DIR/ssl-certs" ]; then
        cp -r "$DEPLOYMENT_DIR/ssl-certs" "$BACKUP_DIR/$BACKUP_NAME/config/"
    fi
    
    # Backup system configuration
    cp /etc/nginx/nginx.conf "$BACKUP_DIR/$BACKUP_NAME/config/nginx-system.conf" 2>/dev/null || true
    cp /etc/fail2ban/jail.local "$BACKUP_DIR/$BACKUP_NAME/config/fail2ban.conf" 2>/dev/null || true
    
    success "Configuration backup completed"
}

# Function to backup logs
backup_logs() {
    log "Backing up logs..."
    
    # Backup application logs
    if [ -d "$DEPLOYMENT_DIR/logs" ]; then
        cp -r "$DEPLOYMENT_DIR/logs"/* "$BACKUP_DIR/$BACKUP_NAME/logs/" 2>/dev/null || true
    fi
    
    # Backup system logs
    cp /var/log/ems-deployment.log "$BACKUP_DIR/$BACKUP_NAME/logs/" 2>/dev/null || true
    cp /var/log/ems-backup.log "$BACKUP_DIR/$BACKUP_NAME/logs/" 2>/dev/null || true
    cp /var/log/nginx/access.log "$BACKUP_DIR/$BACKUP_NAME/logs/nginx-access.log" 2>/dev/null || true
    cp /var/log/nginx/error.log "$BACKUP_DIR/$BACKUP_NAME/logs/nginx-error.log" 2>/dev/null || true
    
    success "Logs backup completed"
}

# Function to create backup archive
create_archive() {
    log "Creating backup archive..."
    
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    
    # Calculate checksum
    sha256sum "$BACKUP_NAME.tar.gz" > "$BACKUP_NAME.tar.gz.sha256"
    
    # Remove temporary directory
    rm -rf "$BACKUP_NAME"
    
    success "Backup archive created: $BACKUP_NAME.tar.gz"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "ems-backup-*.tar.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "ems-backup-*.tar.gz.sha256" -mtime +7 -delete
    
    success "Old backups cleaned up"
}

# Function to upload to S3 (optional)
upload_to_s3() {
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ] && [ -n "$S3_BUCKET" ]; then
        log "Uploading backup to S3..."
        
        aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "s3://$S3_BUCKET/ems-backups/"
        aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz.sha256" "s3://$S3_BUCKET/ems-backups/"
        
        success "Backup uploaded to S3"
    else
        warning "S3 credentials not configured, skipping upload"
    fi
}

# Function to verify backup
verify_backup() {
    log "Verifying backup..."
    
    if [ -f "$BACKUP_DIR/$BACKUP_NAME.tar.gz" ]; then
        # Verify checksum
        cd "$BACKUP_DIR"
        if sha256sum -c "$BACKUP_NAME.tar.gz.sha256"; then
            success "Backup verification successful"
        else
            error "Backup verification failed"
        fi
        
        # Show backup size
        BACKUP_SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)
        log "Backup size: $BACKUP_SIZE"
    else
        error "Backup file not found"
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring from backup: $backup_file"
    
    # Stop services
    cd "$DEPLOYMENT_DIR"
    docker-compose down
    
    # Extract backup
    tar -xzf "$backup_file" -C /tmp/
    BACKUP_DIR_NAME=$(basename "$backup_file" .tar.gz)
    
    # Restore database
    if [ -f "/tmp/$BACKUP_DIR_NAME/database/database.sqlite" ]; then
        cp "/tmp/$BACKUP_DIR_NAME/database/database.sqlite" "$DEPLOYMENT_DIR/"
    fi
    
    # Restore uploads
    if [ -d "/tmp/$BACKUP_DIR_NAME/uploads" ]; then
        cp -r "/tmp/$BACKUP_DIR_NAME/uploads"/* "$DEPLOYMENT_DIR/uploads/" 2>/dev/null || true
    fi
    
    # Restore configuration
    if [ -f "/tmp/$BACKUP_DIR_NAME/config/.env" ]; then
        cp "/tmp/$BACKUP_DIR_NAME/config/.env" "$DEPLOYMENT_DIR/"
    fi
    
    # Cleanup
    rm -rf "/tmp/$BACKUP_DIR_NAME"
    
    # Start services
    docker-compose up -d
    
    success "Restore completed"
}

# Function to list backups
list_backups() {
    log "Available backups:"
    echo "=================="
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null | while read -r line; do
            echo "$line"
        done
    else
        echo "No backups found"
    fi
}

# Main backup function
main() {
    log "Starting EMS backup..."
    
    check_root
    create_backup_dir
    backup_database
    backup_uploads
    backup_config
    backup_logs
    create_archive
    verify_backup
    cleanup_old_backups
    upload_to_s3
    
    success "Backup completed successfully!"
    log "Backup location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
}

# Handle command line arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "verify")
        verify_backup
        ;;
    *)
        echo "Usage: $0 {backup|restore <backup_file>|list|verify}"
        exit 1
        ;;
esac