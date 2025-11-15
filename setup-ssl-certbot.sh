#!/bin/bash

# SSL Certificate Setup Script for app.rsamriddhi.com
# Run this on your EC2 instance

set -e

echo "🔐 Setting up SSL certificates for app.rsamriddhi.com..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo"
    exit 1
fi

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    yum update -y
    yum install -y certbot python3-certbot-nginx
fi

# Stop nginx container temporarily to free port 80
echo "⏹️ Stopping nginx container..."
cd /opt/ems-deployment
docker-compose -f docker-compose.production.yml stop nginx || true

# Get SSL certificate
echo "🔑 Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone \
    -d app.rsamriddhi.com \
    --email infofitsoftware@gmail.com \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http

# Verify certificate was created
if [ -f "/etc/letsencrypt/live/app.rsamriddhi.com/fullchain.pem" ]; then
    echo "✅ SSL certificate obtained successfully!"
    echo "📁 Certificate location: /etc/letsencrypt/live/app.rsamriddhi.com/"
    
    # Restart nginx container
    echo "🔄 Restarting nginx container..."
    docker-compose -f docker-compose.production.yml start nginx || docker-compose -f docker-compose.production.yml up -d nginx
    
    echo ""
    echo "✅ SSL setup complete!"
    echo "🌐 Your application should now be accessible at: https://app.rsamriddhi.com"
    echo ""
    echo "📝 Next steps:"
    echo "1. Test HTTPS: https://app.rsamriddhi.com"
    echo "2. Geolocation should now work!"
    echo "3. Set up auto-renewal (see below)"
    echo ""
    echo "🔄 To set up auto-renewal, run:"
    echo "   sudo crontab -e"
    echo "   Add: 0 0,12 * * * /usr/bin/certbot renew --quiet --post-hook 'cd /opt/ems-deployment && docker-compose -f docker-compose.production.yml restart nginx'"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Please check:"
    echo "1. Domain DNS is pointing to this server (13.234.30.222)"
    echo "2. Port 80 is accessible from the internet"
    echo "3. No firewall is blocking port 80"
    exit 1
fi

