# Rural Samridhi EMS - Production Deployment Guide

## 🚀 Deployment on EC2 Amazon Linux 2

### Prerequisites
- EC2 instance with Amazon Linux 2
- Domain: `app.rsamriddhi.com` pointing to your EC2 IP
- GitHub repository with your code

### Step 1: Prepare Your GitHub Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Production deployment ready"
   git push origin main
   ```

2. **Update the deployment script:**
   - Edit `deploy-ec2.sh`
   - Update `GITHUB_REPO` variable with your actual repository URL

### Step 2: Configure Your Domain

1. **DNS Configuration:**
   - Point `app.rsamriddhi.com` to your EC2 IP: `13.233.73.43`
   - Add A record: `app.rsamriddhi.com` → `13.233.73.43`

### Step 3: Deploy on EC2

1. **Connect to your EC2 instance:**
   ```bash
   ssh -i your-key.pem ec2-user@13.233.73.43
   ```

2. **Download and run the deployment script:**
   ```bash
   # Download the deployment script
   curl -O https://raw.githubusercontent.com/yourusername/rural-samriddhi-ems/main/deploy-ec2.sh
   
   # Make it executable
   chmod +x deploy-ec2.sh
   
   # Run the deployment
   sudo ./deploy-ec2.sh
   ```

### Step 4: Configure Environment Variables

1. **Update production environment:**
   ```bash
   sudo nano /opt/ems/production.env
   ```

2. **Update these variables:**
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### Step 5: Initialize the Application

1. **Create admin user:**
   ```bash
   cd /opt/ems/backend
   sudo -u ec2-user node src/seed.js
   ```

2. **Restart services:**
   ```bash
   sudo systemctl restart ems
   sudo systemctl restart nginx
   ```

### Step 6: Verify Deployment

1. **Check service status:**
   ```bash
   sudo systemctl status ems
   sudo systemctl status nginx
   ```

2. **Test the application:**
   - Frontend: http://app.rsamriddhi.com
   - Backend API: http://app.rsamriddhi.com/api/health

3. **Check logs:**
   ```bash
   sudo journalctl -u ems -f
   ```

## 🔧 Management Commands

### Service Management
```bash
# Start services
sudo systemctl start ems
sudo systemctl start nginx

# Stop services
sudo systemctl stop ems
sudo systemctl stop nginx

# Restart services
sudo systemctl restart ems
sudo systemctl restart nginx

# Check status
sudo systemctl status ems
sudo systemctl status nginx
```

### Application Management
```bash
# View application logs
sudo journalctl -u ems -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Update application
cd /opt/ems
sudo -u ec2-user git pull origin main
sudo systemctl restart ems
```

### Backup Management
```bash
# Manual backup
sudo /opt/ems/backup.sh

# View backups
ls -la /opt/ems/backups/
```

## 🔒 Security Configuration

### Firewall Rules
```bash
# Check firewall status
sudo firewall-cmd --list-all

# Allow specific ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### SSL Certificate (Optional)
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d app.rsamriddhi.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring

### Health Checks
- Application: http://app.rsamriddhi.com/health
- Backend API: http://app.rsamriddhi.com/api/health

### Log Monitoring
```bash
# Real-time logs
sudo journalctl -u ems -f

# Error logs
sudo journalctl -u ems --since "1 hour ago" | grep ERROR

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo journalctl -u ems -n 50
   sudo systemctl status ems
   ```

2. **Nginx configuration error:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **Database issues:**
   ```bash
   cd /opt/ems/backend
   sudo -u ec2-user node src/seed.js
   ```

4. **Permission issues:**
   ```bash
   sudo chown -R ec2-user:ec2-user /opt/ems
   sudo chmod -R 755 /opt/ems
   ```

### Performance Optimization

1. **Enable Nginx caching:**
   ```bash
   sudo nano /etc/nginx/conf.d/default.conf
   # Uncomment caching directives
   sudo systemctl restart nginx
   ```

2. **Database optimization:**
   ```bash
   # Regular database cleanup
   cd /opt/ems/backend
   sudo -u ec2-user node -e "
   const { sequelize } = require('./src/sequelize.js');
   sequelize.query('VACUUM;');
   "
   ```

## 📈 Scaling

### Load Balancing
- Use Application Load Balancer (ALB) for multiple instances
- Configure auto-scaling groups
- Use RDS for database instead of SQLite

### Monitoring
- Set up CloudWatch monitoring
- Configure alerts for CPU, memory, disk usage
- Monitor application logs

## 🔄 Updates

### Application Updates
```bash
cd /opt/ems
sudo -u ec2-user git pull origin main
sudo systemctl restart ems
```

### System Updates
```bash
sudo yum update -y
sudo systemctl restart ems nginx
```

---

## 📞 Support

For deployment issues:
1. Check logs: `sudo journalctl -u ems -f`
2. Verify services: `sudo systemctl status ems nginx`
3. Test connectivity: `curl http://localhost:3001/health`

**Your EMS application is now ready for production!** 🎉
