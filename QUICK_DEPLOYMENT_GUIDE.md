# 🚀 Quick Deployment Guide for EMS System

This guide will help you quickly set up and deploy your EMS system using the CI/CD pipeline.

## ✅ Prerequisites Checklist

- [ ] AWS EC2 instance running (Amazon Linux 2 or Ubuntu)
- [ ] GitHub repository with your code
- [ ] SSH access to your EC2 instance
- [ ] GitHub repository secrets configured

## 🎯 Step 1: Prepare Your EC2 Instance

### Option A: Automated Setup (Recommended)
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Download and run the setup script
curl -o ec2-setup.sh https://raw.githubusercontent.com/infofitsoftwaresolution/ems-system/main/deployment/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh

# Log out and back in to apply Docker group changes
exit
```

### Option B: Manual Setup
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Update system packages
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /home/ec2-user/app
mkdir -p /home/ec2-user/app/uploads
mkdir -p /home/ec2-user/app/ssl-certs

# Log out and back in
exit
```

## 🔐 Step 2: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `EC2_HOST` | Your EC2 public IP | `54.210.132.45` |
| `EC2_SSH_KEY` | Your SSH private key content | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `EC2_USERNAME` | EC2 username | `ec2-user` |
| `JWT_SECRET` | Strong JWT secret | `your-super-secret-jwt-key-here` |

## 🚀 Step 3: Deploy Your Application

### Automatic Deployment (CI/CD)
1. **Push to main branch** - The CI/CD pipeline will automatically:
   - Run tests
   - Build Docker images
   - Deploy to EC2
   - Verify deployment

```bash
git add .
git commit -m "Deploy EMS application"
git push origin main
```

2. **Monitor deployment** - Go to GitHub → Actions tab to watch the deployment progress

### Manual Deployment (If needed)
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to app directory
cd /home/ec2-user/app

# Start the application
./start.sh

# Check status
./health-check.sh
```

## 🏥 Step 4: Verify Deployment

### Health Checks
- **Backend**: `http://your-ec2-ip:3001/api/health`
- **Frontend**: `http://your-ec2-ip`

### Manual Verification
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Run health checks
cd /home/ec2-user/app
./health-check.sh

# View logs
./logs.sh

# Check container status
docker-compose ps
```

## 🛠️ Step 5: Application Management

### Available Scripts
```bash
cd /home/ec2-user/app

# Start application
./start.sh

# Stop application
./stop.sh

# Restart application
./restart.sh

# View logs
./logs.sh

# Run health checks
./health-check.sh
```

### Environment Configuration
```bash
# Edit environment variables
nano .env

# Key variables to configure:
# - JWT_SECRET: Your JWT secret key
# - EMAIL_HOST: SMTP server (if using email)
# - EMAIL_USER: Email username
# - EMAIL_PASS: Email password
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Docker Permission Denied**
```bash
# Add user to docker group
sudo usermod -a -G docker ec2-user
# Log out and back in
```

#### 2. **Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :80

# Stop conflicting services
sudo systemctl stop httpd  # If Apache is running
```

#### 3. **Health Check Fails**
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Check if containers are running
docker-compose ps

# Restart containers
docker-compose restart
```

#### 4. **Database Issues**
```bash
# Check database file permissions
ls -la uploads/database.sqlite

# Reset database (if needed)
rm uploads/database.sqlite
docker-compose restart backend
```

### Debug Commands
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps

# Test backend health
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost

# Check nginx configuration
docker-compose exec frontend nginx -t
```

## 🔒 Security Considerations

### 1. **Update Default Secrets**
```bash
# Generate a strong JWT secret
openssl rand -base64 32

# Update in GitHub secrets or .env file
```

### 2. **Configure Firewall**
```bash
# Allow necessary ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### 3. **SSL Setup (Optional)**
```bash
# Install certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx configuration for SSL
```

## 📊 Monitoring

### Application Status
```bash
# Quick status check
cd /home/ec2-user/app && ./health-check.sh

# Detailed status
docker-compose ps
docker stats
```

### Log Monitoring
```bash
# Real-time logs
./logs.sh

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🆘 Support

### Quick Commands Reference
```bash
# Application management
./start.sh          # Start application
./stop.sh           # Stop application
./restart.sh        # Restart application
./logs.sh           # View logs
./health-check.sh   # Run health checks

# Docker commands
docker-compose ps                    # Check status
docker-compose logs                  # View logs
docker-compose restart               # Restart all
docker-compose exec backend bash     # Access backend container
docker-compose exec frontend sh      # Access frontend container
```

### Getting Help
1. Check the logs: `./logs.sh`
2. Run health checks: `./health-check.sh`
3. Review the troubleshooting section above
4. Check GitHub Actions logs for deployment issues

---

## 🎉 Success!

Your EMS system should now be running at:
- **Frontend**: `http://your-ec2-ip`
- **Backend API**: `http://your-ec2-ip:3001/api`
- **Health Check**: `http://your-ec2-ip:3001/api/health`

The CI/CD pipeline will automatically deploy updates whenever you push to the main branch! 🚀
