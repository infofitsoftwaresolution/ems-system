#!/bin/bash
# Backup script for EMS deployment

set -e

echo "Creating backup before deployment..."

# Navigate to app directory
cd /home/ec2-user/app

# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Backup current images if they exist
if docker images | grep -q "backend:latest"; then
    echo "Backing up current backend image..."
    docker save backend:latest | gzip > "$BACKUP_DIR/backend-backup.tar.gz"
fi

if docker images | grep -q "frontend:latest"; then
    echo "Backing up current frontend image..."
    docker save frontend:latest | gzip > "$BACKUP_DIR/frontend-backup.tar.gz"
fi

# Backup database if it exists
if [ -f "uploads/database.sqlite" ]; then
    echo "Backing up database..."
    cp uploads/database.sqlite "$BACKUP_DIR/database.sqlite"
fi

# Backup uploads directory
if [ -d "uploads" ]; then
    echo "Backing up uploads directory..."
    cp -r uploads "$BACKUP_DIR/uploads"
fi

# Create symlinks for easy rollback
ln -sf "$BACKUP_DIR/backend-backup.tar.gz" backend-backup.tar.gz
ln -sf "$BACKUP_DIR/frontend-backup.tar.gz" frontend-backup.tar.gz

echo "Backup completed successfully."
echo "Backup location: $BACKUP_DIR"
echo "Symlinks created for easy rollback."
