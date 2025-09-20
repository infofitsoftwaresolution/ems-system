#!/bin/bash
# Rollback script for EMS deployment

set -e

echo "Starting rollback process..."

# Navigate to app directory
cd /home/ec2-user/app

# Stop current containers
echo "Stopping current containers..."
docker-compose down || true

# Check if backup images exist
if [ -f "backend-backup.tar.gz" ] && [ -f "frontend-backup.tar.gz" ]; then
    echo "Found backup images. Restoring..."
    
    # Load backup images
    docker load -i backend-backup.tar.gz
    docker load -i frontend-backup.tar.gz
    
    # Start containers with backup images
    docker-compose up -d
    
    echo "Rollback completed successfully."
    echo "Application is now running with previous version."
else
    echo "No backup images found."
    echo "Please check if backup was created before deployment."
    exit 1
fi

# Verify rollback
echo "Verifying rollback..."
sleep 10

if docker-compose ps | grep -q "Up"; then
    echo "✅ Rollback successful - containers are running"
else
    echo "❌ Rollback failed - containers are not running"
    docker-compose logs
    exit 1
fi
