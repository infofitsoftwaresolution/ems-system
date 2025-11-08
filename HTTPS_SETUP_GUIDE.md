# HTTPS Setup Guide for app.rsamriddhi.com

## Prerequisites
- Domain: `app.rsamriddhi.com` pointing to EC2 IP: `13.234.30.222`
- EC2 instance with Docker and Docker Compose
- Ports 80 and 443 open in AWS Security Group

## Step 1: Update AWS Security Group

1. Go to AWS Console → EC2 → Security Groups
2. Select your EC2 instance's security group
3. Add Inbound Rules:
   - **Type**: HTTPS, **Port**: 443, **Source**: 0.0.0.0/0
   - **Type**: HTTP, **Port**: 80, **Source**: 0.0.0.0/0 (if not already added)

## Step 2: Install Certbot on EC2

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@13.234.30.222

# Install Certbot
sudo yum update -y
sudo yum install -y certbot python3-certbot-nginx
```

## Step 3: Stop Nginx Container Temporarily

```bash
cd /opt/ems-deployment
docker-compose -f docker-compose.production.yml stop nginx
```

## Step 4: Get SSL Certificate

```bash
# Get certificate (replace email with your email)
sudo certbot certonly --standalone \
  -d app.rsamriddhi.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

## Step 5: Update Nginx Configuration

The nginx config will be updated automatically. After getting the certificate, restart nginx.

## Step 6: Restart Nginx

```bash
cd /opt/ems-deployment
docker-compose -f docker-compose.production.yml start nginx
```

## Step 7: Test HTTPS

Visit: `https://app.rsamriddhi.com`

## Step 8: Set Up Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e
# Add this line:
0 0,12 * * * /usr/bin/certbot renew --quiet --post-hook "cd /opt/ems-deployment && docker-compose -f docker-compose.production.yml restart nginx"
```

## Troubleshooting

### Certificate not found
- Check: `sudo ls -la /etc/letsencrypt/live/app.rsamriddhi.com/`
- Ensure domain DNS is pointing to EC2 IP

### Port 80 blocked
- Check Security Group rules
- Ensure no other service is using port 80

### Certificate renewal fails
- Ensure port 80 is accessible
- Check certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

