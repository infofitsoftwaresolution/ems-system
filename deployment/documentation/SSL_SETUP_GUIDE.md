# SSL/HTTPS Setup Guide for Employee Management System

This guide will help you set up SSL/HTTPS for your Employee Management System using Let's Encrypt certificates.

## Prerequisites

- EC2 instance running your application
- Domain pointing to your EC2 instance (using nip.io for testing)
- Docker and Docker Compose installed
- Ports 80 and 443 open in security groups

## Quick Setup (Automated)

1. **Upload files to EC2**:
   ```bash
   # Copy these files to your EC2 instance:
   # - nginx-ssl.conf.template
   # - Dockerfile.frontend.ssl
   # - setup-ssl.sh
   ```

2. **Run the setup script**:
   ```bash
   chmod +x setup-ssl.sh
   ./setup-ssl.sh
   ```

## Manual Setup (Step by Step)

### Step 1: Install Certbot

```bash
# Update system
sudo yum update -y

# Install Python and pip
sudo yum install -y python3 python3-pip

# Install Certbot
sudo pip3 install certbot
```

### Step 2: Stop Frontend Container

```bash
# Stop frontend to free up port 80
docker stop frontend
```

### Step 3: Get SSL Certificate

```bash
# Get SSL certificate (replace email with your email)
sudo certbot certonly \
    --standalone \
    -d 13.233.73.43.nip.io \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com
```

### Step 4: Build SSL-Enabled Frontend

```bash
# Build the SSL-enabled frontend
docker build -f Dockerfile.frontend.ssl -t employee-frontend-ssl .
```

### Step 5: Start SSL-Enabled Frontend

```bash
# Stop and remove old frontend
docker stop frontend
docker rm frontend

# Start SSL-enabled frontend with certificate volume
docker run -d \
    --name frontend \
    -p 80:80 \
    -p 443:443 \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    -e BACKEND_URL=http://backend:3001 \
    --network employee-management_default \
    employee-frontend-ssl
```

### Step 6: Set Up Auto-Renewal

```bash
# Add renewal cron job
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/local/bin/certbot renew --quiet --post-hook 'docker restart frontend'"; } | sudo crontab -
```

## Verification

After setup, verify SSL is working:

1. **Check HTTP redirect**:
   ```bash
   curl -I http://13.233.73.43.nip.io
   # Should return 301 redirect to HTTPS
   ```

2. **Check HTTPS**:
   ```bash
   curl -I https://13.233.73.43.nip.io
   # Should return 200 OK
   ```

3. **Test in browser**:
   - Visit `http://13.233.73.43.nip.io` (should redirect to HTTPS)
   - Visit `https://13.233.73.43.nip.io` (should show secure connection)

## Security Features

The SSL configuration includes:

- **TLS 1.2 and 1.3** support
- **Strong cipher suites**
- **HSTS headers** for security
- **HTTP to HTTPS redirect**
- **Security headers** (X-Frame-Options, CSP, etc.)

## Geolocation Fix

With HTTPS enabled, the geolocation API will work properly in the attendance system:

- ✅ No more "secure origins" errors
- ✅ Precise GPS location capture
- ✅ Better user experience

## Troubleshooting

### Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Check certificate files
ls -la /etc/letsencrypt/live/13.233.73.43.nip.io/
```

### Container Issues

```bash
# Check container logs
docker logs frontend

# Check if ports are open
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :80
```

### Firewall Issues

```bash
# Check security groups (AWS Console)
# Ensure ports 80 and 443 are open

# Check local firewall
sudo iptables -L
```

## File Structure

After setup, you should have:

```
/etc/letsencrypt/
├── live/
│   └── 13.233.73.43.nip.io/
│       ├── fullchain.pem
│       ├── privkey.pem
│       ├── cert.pem
│       └── chain.pem
└── renewal/
    └── 13.233.73.43.nip.io.conf
```

## Environment Variables

The SSL-enabled frontend uses:

- `BACKEND_URL`: Backend service URL (default: `http://backend:3001`)
- SSL certificates are mounted from `/etc/letsencrypt`

## Auto-Renewal

Certificates auto-renew every 3 months via cron job:

```bash
# Check cron job
sudo crontab -l

# Manual renewal test
sudo certbot renew --dry-run
```

## Production Considerations

For production use:

1. **Use a real domain** instead of nip.io
2. **Set up monitoring** for certificate expiration
3. **Configure backup** for certificate files
4. **Use AWS Certificate Manager** for better integration
5. **Set up CloudFront** for global distribution

## Support

If you encounter issues:

1. Check container logs: `docker logs frontend`
2. Verify certificate: `sudo certbot certificates`
3. Test connectivity: `curl -I https://your-domain.com`
4. Check security groups in AWS Console






