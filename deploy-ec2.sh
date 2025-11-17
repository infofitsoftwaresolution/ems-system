#!/bin/bash

# Rural Samriddhi EMS - EC2 Amazon Linux 2 Deployment Script
# Domain: app.rsamriddhi.com
# IP: 13.233.73.43

set -e

echo "🚀 Starting Rural Samriddhi EMS Deployment on EC2"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="app.rsamriddhi.com"
IP="13.233.73.43"
APP_DIR="/opt/ems"
GITHUB_REPO="https://github.com/yourusername/rural-samridhi-ems.git"  # Update this with your actual repo

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_status "Updating system packages..."
yum update -y

print_status "Installing required packages..."
yum install -y git curl wget unzip

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Docker
print_status "Installing Docker..."
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose
print_status "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
print_status "Installing Nginx..."
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (update with your actual GitHub repo)
print_status "Cloning repository..."
if [ -d "rural-samridhi-ems" ]; then
    print_warning "Repository already exists, updating..."
    cd rural-samridhi-ems
    git pull origin main
else
    git clone $GITHUB_REPO
    cd rural-samridhi-ems
fi

# Set up environment
print_status "Setting up environment..."
cp production.env .env

# Create necessary directories
mkdir -p backend/uploads backend/logs backend/data
mkdir -p ssl

# Set permissions
chown -R ec2-user:ec2-user $APP_DIR
chmod -R 755 $APP_DIR

# Configure Nginx
print_status "Configuring Nginx..."
cp nginx.production.conf /etc/nginx/conf.d/default.conf

# Update Nginx configuration with actual domain
sed -i "s/app.rsamriddhi.com/$DOMAIN/g" /etc/nginx/conf.d/default.conf
sed -i "s/13.233.73.43/$IP/g" /etc/nginx/conf.d/default.conf

# Test Nginx configuration
nginx -t

# Install application dependencies
print_status "Installing backend dependencies..."
cd backend
npm install --production

print_status "Installing frontend dependencies..."
cd ../frontend
npm install --production

# Build frontend
print_status "Building frontend..."
npm run build

# Go back to root directory
cd ..

# Create systemd service for the application
print_status "Creating systemd service..."
cat > /etc/systemd/system/ems.service << EOF
[Unit]
Description=Rural Samriddhi EMS
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable ems
systemctl start ems

# Restart Nginx
systemctl restart nginx

# Configure firewall
print_status "Configuring firewall..."
yum install -y firewalld
systemctl start firewalld
systemctl enable firewalld

# Allow HTTP and HTTPS
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Create backup script
print_status "Creating backup script..."
cat > $APP_DIR/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/ems/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp /opt/ems/backend/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/ems/backend/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x $APP_DIR/backup.sh

# Set up cron job for backups
print_status "Setting up automated backups..."
echo "0 2 * * * $APP_DIR/backup.sh" | crontab -u ec2-user -

# Create monitoring script
print_status "Creating monitoring script..."
cat > $APP_DIR/monitor.sh << 'EOF'
#!/bin/bash
# Check if services are running
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is down, restarting..."
    systemctl restart nginx
fi

if ! systemctl is-active --quiet ems; then
    echo "EMS service is down, restarting..."
    systemctl restart ems
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is ${DISK_USAGE}%"
fi
EOF

chmod +x $APP_DIR/monitor.sh

# Set up monitoring cron job
echo "*/5 * * * * $APP_DIR/monitor.sh" | crontab -u ec2-user -

print_status "Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$DOMAIN"
echo "   Backend API: http://$DOMAIN/api"
echo ""
echo "📊 Service Status:"
systemctl status nginx --no-pager
systemctl status ems --no-pager
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: journalctl -u ems -f"
echo "   Restart app: systemctl restart ems"
echo "   Check status: systemctl status ems"
echo "   Manual backup: $APP_DIR/backup.sh"
echo ""
echo "✅ Deployment completed successfully!"


