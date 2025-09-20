#!/bin/bash
# Environment setup script for EMS deployment

set -e

echo "Setting up environment variables for EMS deployment..."

# Create app directory if it doesn't exist
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Create .env file with production environment variables
cat > .env << EOF
# Production Environment Variables
NODE_ENV=production
DB_PATH=/app/database.sqlite
JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production}
PORT=3001

# Email Configuration (if using email service)
EMAIL_HOST=${EMAIL_HOST:-}
EMAIL_PORT=${EMAIL_PORT:-587}
EMAIL_USER=${EMAIL_USER:-}
EMAIL_PASS=${EMAIL_PASS:-}
EMAIL_FROM=${EMAIL_FROM:-noreply@yourdomain.com}

# SSL Configuration (if using SSL)
SSL_ENABLED=${SSL_ENABLED:-false}
SSL_CERT_PATH=${SSL_CERT_PATH:-/etc/ssl/certs/cert.pem}
SSL_KEY_PATH=${SSL_KEY_PATH:-/etc/ssl/certs/key.pem}

# Backend URL for frontend
BACKEND_URL=http://backend:3001
EOF

# Create necessary directories
mkdir -p uploads/kyc uploads/payslips ssl-certs

# Set proper permissions
chown -R ec2-user:ec2-user /home/ec2-user/app
chmod 755 /home/ec2-user/app
chmod 644 /home/ec2-user/app/.env

echo "Environment setup complete."
echo "Created .env file with production settings."
echo "Created necessary directories: uploads/kyc, uploads/payslips, ssl-certs"

# Display environment info
echo ""
echo "Environment Information:"
echo "======================="
echo "App Directory: /home/ec2-user/app"
echo "Environment: production"
echo "Database: SQLite at /app/database.sqlite"
echo "Backend Port: 3001"
echo "Frontend Ports: 80 (HTTP), 443 (HTTPS)"
echo ""
echo "To start the application, run:"
echo "cd /home/ec2-user/app && docker-compose up -d"
