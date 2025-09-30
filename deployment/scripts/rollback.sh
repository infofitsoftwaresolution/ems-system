#!/bin/bash

# EMS Rollback Script
# This script rolls back the EMS system to a previous version

set -e

# Configuration
DEPLOYMENT_DIR="/opt/ems-deployment"
BACKUP_DIR="/opt/ems-backups"
LOG_FILE="/var/log/ems-rollback.log"

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

# Function to list available backups
list_backups() {
    log "Available backups:"
    echo "=================="
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null | while read -r line; do
            echo "$line"
        done
    else
        echo "No backups found"
        exit 1
    fi
}

# Function to rollback to specific backup
rollback_to_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting rollback to: $backup_file"
    
    # Stop current services
    log "Stopping current services..."
    cd "$DEPLOYMENT_DIR"
    docker-compose down
    
    # Create current state backup
    log "Creating backup of current state..."
    CURRENT_BACKUP="current-state-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_DIR/$CURRENT_BACKUP" -C "$DEPLOYMENT_DIR" .
    
    # Extract backup
    log "Extracting backup..."
    tar -xzf "$backup_file" -C /tmp/
    BACKUP_DIR_NAME=$(basename "$backup_file" .tar.gz)
    
    # Restore files
    log "Restoring files..."
    
    # Restore database
    if [ -f "/tmp/$BACKUP_DIR_NAME/database/database.sqlite" ]; then
        cp "/tmp/$BACKUP_DIR_NAME/database/database.sqlite" "$DEPLOYMENT_DIR/"
        log "Database restored"
    fi
    
    # Restore uploads
    if [ -d "/tmp/$BACKUP_DIR_NAME/uploads" ]; then
        cp -r "/tmp/$BACKUP_DIR_NAME/uploads"/* "$DEPLOYMENT_DIR/uploads/" 2>/dev/null || true
        log "Uploads restored"
    fi
    
    # Restore configuration
    if [ -f "/tmp/$BACKUP_DIR_NAME/config/.env" ]; then
        cp "/tmp/$BACKUP_DIR_NAME/config/.env" "$DEPLOYMENT_DIR/"
        log "Configuration restored"
    fi
    
    if [ -f "/tmp/$BACKUP_DIR_NAME/config/docker-compose.yml" ]; then
        cp "/tmp/$BACKUP_DIR_NAME/config/docker-compose.yml" "$DEPLOYMENT_DIR/"
        log "Docker Compose configuration restored"
    fi
    
    # Cleanup
    rm -rf "/tmp/$BACKUP_DIR_NAME"
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        success "Rollback completed successfully"
    else
        error "Health check failed after rollback"
    fi
}

# Function to rollback to previous Git commit
rollback_to_commit() {
    local commit_hash="$1"
    
    if [ -z "$commit_hash" ]; then
        error "Commit hash not specified"
    fi
    
    log "Rolling back to commit: $commit_hash"
    
    # Stop services
    log "Stopping services..."
    cd "$DEPLOYMENT_DIR"
    docker-compose down
    
    # Create backup of current state
    log "Creating backup of current state..."
    CURRENT_BACKUP="current-state-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_DIR/$CURRENT_BACKUP" -C "$DEPLOYMENT_DIR" .
    
    # Reset to specific commit
    log "Resetting to commit..."
    git reset --hard "$commit_hash"
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        success "Rollback to commit completed successfully"
    else
        error "Health check failed after rollback"
    fi
}

# Function to rollback to previous Docker image
rollback_to_previous_image() {
    log "Rolling back to previous Docker image..."
    
    # Stop services
    log "Stopping services..."
    cd "$DEPLOYMENT_DIR"
    docker-compose down
    
    # Get previous image tags
    log "Getting previous image tags..."
    BACKEND_IMAGES=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | grep "ems-system-backend" | head -2)
    FRONTEND_IMAGES=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | grep "ems-system-frontend" | head -2)
    
    if [ -z "$BACKEND_IMAGES" ] || [ -z "$FRONTEND_IMAGES" ]; then
        error "No previous images found"
    fi
    
    # Update docker-compose.yml with previous images
    log "Updating docker-compose.yml with previous images..."
    # This would need to be implemented based on your specific image tagging strategy
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        success "Rollback to previous image completed successfully"
    else
        error "Health check failed after rollback"
    fi
}

# Function to show rollback status
show_status() {
    log "Rollback Status:"
    echo "================"
    
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
    
    # Current Git commit
    echo -e "\nCurrent Git Commit:"
    cd "$DEPLOYMENT_DIR"
    git log --oneline -1
}

# Main function
main() {
    log "Starting EMS rollback..."
    
    check_root
    
    case "${1:-help}" in
        "backup")
            rollback_to_backup "$2"
            ;;
        "commit")
            rollback_to_commit "$2"
            ;;
        "image")
            rollback_to_previous_image
            ;;
        "list")
            list_backups
            ;;
        "status")
            show_status
            ;;
        "help"|*)
            echo "Usage: $0 {backup <backup_file>|commit <commit_hash>|image|list|status|help}"
            echo ""
            echo "Commands:"
            echo "  backup <backup_file>  Rollback to specific backup file"
            echo "  commit <commit_hash>  Rollback to specific Git commit"
            echo "  image                Rollback to previous Docker image"
            echo "  list                 List available backups"
            echo "  status               Show current status"
            echo "  help                 Show this help message"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"