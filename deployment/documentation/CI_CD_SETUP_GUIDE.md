# EMS System CI/CD Setup Guide

This guide provides step-by-step instructions for setting up CI/CD for the EMS (Employee Management System) using GitHub Actions, Docker, and AWS EC2.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [AWS EC2 Setup](#aws-ec2-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Deployment Process](#deployment-process)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts and Services
- GitHub account with repository access
- AWS account with EC2 access
- Domain name (optional, for SSL)

### Required Tools
- Git
- Docker (for local testing)
- SSH client
- AWS CLI (optional)

## GitHub Repository Setup

### 1. Push Your Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/infofitsoftwaresolution/ems-system.git

# Add all files
git add .

# Commit changes
git commit -m "Initial commit with CI/CD setup"

# Push to main branch
git push -u origin main
```

### 2. Enable GitHub Container Registry

1. Go to your repository settings
2. Navigate to "Actions" → "General"
3. Under "Workflow permissions", select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"

## AWS EC2 Setup

### 1. Launch EC2 Instance

1. **Instance Type**: t3.medium or larger (recommended: t3.large)
2. **Operating System**: Ubuntu 22.04 LTS
3. **Storage**: 20GB minimum (recommended: 50GB)
4. **Security Group**: 
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom (3001) - 0.0.0.0/0 (for backend API)

### 2. Connect to EC2 Instance

```bash
# Replace with your key file and instance details
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### 3. Run Initial Setup Script

```bash
# Download and run the EC2 setup script
curl -o ec2-setup.sh https://raw.githubusercontent.com/infofitsoftwaresolution/ems-system/main/deployment/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

### 4. Clone Repository on EC2

```bash
# Create deployment directory
sudo mkdir -p /opt/ems-deployment
sudo chown ubuntu:ubuntu /opt/ems-deployment

# Clone repository
cd /opt/ems-deployment
git clone https://github.com/infofitsoftwaresolution/ems-system.git .
```

## GitHub Secrets Configuration

### 1. Navigate to Repository Secrets

1. Go to your GitHub repository
2. Click on "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"

### 2. Required Secrets

Add the following secrets:

#### AWS Credentials
```
AWS_ACCESS_KEY_ID: Your AWS access key
AWS_SECRET_ACCESS_KEY: Your AWS secret key
AWS_REGION: us-east-1 (or your preferred region)
```

#### EC2 Connection Details
```
EC2_HOST: your-ec2-public-ip
EC2_USERNAME: ubuntu
EC2_SSH_KEY: Your private SSH key content
EC2_PORT: 22
```

#### Application Secrets
```
JWT_SECRET: Generate a strong secret key
GITHUB_TOKEN: Your GitHub personal access token
```

#### Optional Secrets
```
SLACK_WEBHOOK: Slack webhook URL for notifications
S3_BUCKET: S3 bucket name for backups
```

### 3. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with these scopes:
   - `repo` (Full control of private repositories)
   - `write:packages` (Upload packages to GitHub Package Registry)
   - `read:packages` (Download packages from GitHub Package Registry)

## Deployment Process

### 1. Manual Deployment (First Time)

```bash
# SSH into your EC2 instance
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Run deployment script
cd /opt/ems-deployment
sudo ./deployment/scripts/deploy-to-ec2.sh
```

### 2. Automatic Deployment

Once configured, deployments happen automatically when you push to the `main` branch:

```bash
# Make changes to your code
git add .
git commit -m "Update application"
git push origin main
```

The CI/CD pipeline will:
1. Run tests
2. Build Docker images
3. Push images to GitHub Container Registry
4. Deploy to EC2
5. Run health checks

### 3. Manual Deployment Commands

```bash
# Check deployment status
sudo ./deployment/scripts/deploy-to-ec2.sh status

# View logs
sudo ./deployment/scripts/deploy-to-ec2.sh logs

# Restart services
sudo ./deployment/scripts/deploy-to-ec2.sh restart

# Create backup
sudo ./deployment/scripts/backup.sh
```

## Monitoring and Maintenance

### 1. Health Checks

The system includes automatic health checks:
- Backend API: `http://your-ec2-ip/api/health`
- Frontend: `http://your-ec2-ip/`

### 2. Log Monitoring

```bash
# View application logs
docker-compose -f /opt/ems-deployment/docker-compose.yml logs -f

# View system logs
tail -f /var/log/ems-deployment.log
tail -f /var/log/system-monitor.log
```

### 3. Backup Management

```bash
# Create backup
sudo ./deployment/scripts/backup.sh

# List backups
sudo ./deployment/scripts/backup.sh list

# Restore from backup
sudo ./deployment/scripts/backup.sh restore /opt/ems-backups/ems-backup-YYYYMMDD-HHMMSS.tar.gz
```

### 4. System Monitoring

The setup includes automatic monitoring:
- CPU, memory, and disk usage
- Docker container status
- Application health checks

## Troubleshooting

### Common Issues

#### 1. Deployment Fails

**Check logs:**
```bash
# View GitHub Actions logs
# Go to your repository → Actions tab → Click on failed workflow

# View EC2 logs
tail -f /var/log/ems-deployment.log
```

**Common solutions:**
- Verify all GitHub secrets are set correctly
- Check EC2 security group settings
- Ensure EC2 instance has enough resources

#### 2. Application Not Accessible

**Check services:**
```bash
# Check if containers are running
docker ps

# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3001
```

**Check firewall:**
```bash
# Check UFW status
sudo ufw status

# Check if ports are allowed
sudo ufw allow 80
sudo ufw allow 443
```

#### 3. Docker Issues

**Clean up Docker:**
```bash
# Remove unused containers and images
docker system prune -a

# Restart Docker service
sudo systemctl restart docker
```

#### 4. SSL Certificate Issues

**Generate new certificates:**
```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ems.key \
  -out /etc/ssl/certs/ems.crt
```

### Getting Help

1. Check the logs first
2. Review GitHub Actions workflow runs
3. Verify all secrets are configured correctly
4. Check EC2 instance status and resources

## Security Best Practices

### 1. SSH Key Management
- Use strong SSH keys
- Regularly rotate keys
- Limit SSH access to specific IPs

### 2. Firewall Configuration
- Only open necessary ports
- Use fail2ban for additional protection
- Regularly update security groups

### 3. Application Security
- Use strong JWT secrets
- Enable HTTPS in production
- Regular security updates

### 4. Backup Strategy
- Regular automated backups
- Test backup restoration
- Store backups in multiple locations

## Performance Optimization

### 1. EC2 Instance Sizing
- Monitor resource usage
- Scale up if needed
- Use appropriate instance types

### 2. Docker Optimization
- Use multi-stage builds
- Optimize image sizes
- Use health checks

### 3. Database Optimization
- Regular database maintenance
- Monitor query performance
- Consider connection pooling

## Next Steps

1. **Set up monitoring**: Consider using AWS CloudWatch or similar
2. **Implement SSL**: Use Let's Encrypt for free SSL certificates
3. **Set up load balancing**: For high availability
4. **Database optimization**: Consider using RDS for production
5. **Backup automation**: Set up automated backups to S3

## Support

For issues and questions:
1. Check this documentation
2. Review GitHub Issues
3. Check application logs
4. Contact the development team

---

**Note**: This guide assumes you have basic knowledge of Git, Docker, and AWS EC2. If you encounter issues, please refer to the troubleshooting section or contact support.
