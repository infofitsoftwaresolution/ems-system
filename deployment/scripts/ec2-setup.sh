#!/bin/bash
# EC2 Setup Script for EMS Application
# Run this script on your EC2 instance to prepare it for deployment

set -e

echo "🚀 Setting up EC2 instance for EMS deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory structure
echo "📁 Creating application directories..."
mkdir -p /home/ec2-user/app
mkdir -p /home/ec2-user/app/uploads/kyc
mkdir -p /home/ec2-user/app/uploads/payslips
mkdir -p /home/ec2-user/app/ssl-certs
mkdir -p /home/ec2-user/app/backups

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R ec2-user:ec2-user /home/ec2-user/app
chmod 755 /home/ec2-user/app

# Create environment file template
echo "⚙️ Creating environment file template..."
cat > /home/ec2-user/app/.env.example << EOF
# Environment Configuration Template
# Copy this file to .env and update the values

# Application Environment
NODE_ENV=production
PORT=3001

# Database Configuration
DB_PATH=/app/database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Optional)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@yourdomain.com

# SSL Configuration (Optional)
SSL_ENABLED=false
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/certs/key.pem

# Backend URL for frontend
BACKEND_URL=http://backend:3001
EOF

# Create a simple startup script
echo "📝 Creating startup script..."
cat > /home/ec2-user/app/start.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/app

# Check if .env exists, if not create from template
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your actual values!"
fi

# Start the application
echo "🚀 Starting EMS application..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check status
echo "📊 Application status:"
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20
EOF

chmod +x /home/ec2-user/app/start.sh

# Create a stop script
echo "📝 Creating stop script..."
cat > /home/ec2-user/app/stop.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/app
echo "🛑 Stopping EMS application..."
docker-compose down
echo "✅ Application stopped"
EOF

chmod +x /home/ec2-user/app/stop.sh

# Create a restart script
echo "📝 Creating restart script..."
cat > /home/ec2-user/app/restart.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/app
echo "🔄 Restarting EMS application..."
docker-compose down
docker-compose up -d
echo "✅ Application restarted"
EOF

chmod +x /home/ec2-user/app/restart.sh

# Create a logs script
echo "📝 Creating logs script..."
cat > /home/ec2-user/app/logs.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/app
echo "📋 Showing EMS application logs..."
docker-compose logs -f
EOF

chmod +x /home/ec2-user/app/logs.sh

# Install curl for health checks
echo "🔧 Installing curl..."
sudo yum install curl -y

# Create a health check script
echo "📝 Creating health check script..."
cat > /home/ec2-user/app/health-check.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/app

echo "🏥 Running health checks..."

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers are running"
else
    echo "❌ Containers are not running"
    exit 1
fi

# Check backend health
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

echo "🎉 All health checks passed!"
EOF

chmod +x /home/ec2-user/app/health-check.sh

echo ""
echo "✅ EC2 setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Log out and log back in to apply Docker group changes"
echo "2. Set up GitHub secrets in your repository"
echo "3. Push your code to trigger the CI/CD pipeline"
echo ""
echo "📁 Application directory: /home/ec2-user/app"
echo "🔧 Available scripts:"
echo "   - start.sh: Start the application"
echo "   - stop.sh: Stop the application"
echo "   - restart.sh: Restart the application"
echo "   - logs.sh: View application logs"
echo "   - health-check.sh: Run health checks"
echo ""
echo "⚙️ Don't forget to update the .env file with your actual values!"
echo ""
echo "🚀 Your EC2 instance is now ready for EMS deployment!"
