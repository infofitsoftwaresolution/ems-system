#!/bin/bash

# SSL Setup Script for Employee Management System
# Run this script on your EC2 instance

set -e

echo "🔐 Setting up SSL/HTTPS for Employee Management System..."

# Step 1: Install Certbot
echo "📦 Installing Certbot..."
sudo yum update -y
sudo yum install -y python3 python3-pip
sudo pip3 install certbot

# Step 2: Stop frontend container to free up port 80
echo "⏹️ Stopping frontend container..."
docker stop frontend || echo "Frontend container not running"

# Step 3: Get SSL Certificate
echo "🔑 Obtaining SSL certificate..."
sudo certbot certonly \
    --standalone \
    -d 13.233.73.43.nip.io \
    --non-interactive \
    --agree-tos \
    --email admin@13.233.73.43.nip.io \
    --expand

# Step 4: Create certificate directory in container
echo "📁 Setting up certificate directory..."
sudo mkdir -p /etc/letsencrypt/live/13.233.73.43.nip.io
sudo chmod 755 /etc/letsencrypt/live/13.233.73.43.nip.io

# Step 5: Build and run SSL-enabled frontend
echo "🐳 Building SSL-enabled frontend container..."
docker build -f Dockerfile.frontend.ssl -t employee-frontend-ssl .

# Step 6: Stop old frontend and start SSL-enabled frontend
echo "🔄 Switching to SSL-enabled frontend..."
docker stop frontend || echo "No old frontend to stop"
docker rm frontend || echo "No old frontend to remove"

# Run with SSL certificate volume mount
docker run -d \
    --name frontend \
    -p 80:80 \
    -p 443:443 \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    -e BACKEND_URL=http://backend:3001 \
    --network employee-management_default \
    employee-frontend-ssl

# Step 7: Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/local/bin/certbot renew --quiet --post-hook 'docker restart frontend'"; } | sudo crontab -

echo "✅ SSL setup complete!"
echo ""
echo "🌐 Your application is now available at:"
echo "   HTTP:  http://13.233.73.43.nip.io (redirects to HTTPS)"
echo "   HTTPS: https://13.233.73.43.nip.io"
echo ""
echo "🔒 SSL certificate will auto-renew every 3 months"
echo "📱 Geolocation will now work properly with HTTPS!"






