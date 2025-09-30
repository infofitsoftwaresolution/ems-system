# EMS CI/CD Quick Start Guide

Get your EMS system up and running with CI/CD in 30 minutes!

## Prerequisites Checklist

- [ ] GitHub repository: `https://github.com/infofitsoftwaresolution/ems-system`
- [ ] AWS account with EC2 access
- [ ] Domain name (optional)
- [ ] SSH client installed

## Step 1: Launch EC2 Instance (5 minutes)

### 1.1 Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. **Name**: `ems-production`
3. **AMI**: Ubuntu 22.04 LTS
4. **Instance Type**: t3.medium
5. **Key Pair**: Create new or use existing
6. **Security Group**: Create new with these rules:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom (3001) - 0.0.0.0/0

### 1.2 Connect to Instance
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

## Step 2: Setup EC2 Instance (10 minutes)

### 2.1 Run Setup Script
```bash
# Download and run setup script
curl -o ec2-setup.sh https://raw.githubusercontent.com/infofitsoftwaresolution/ems-system/main/deployment/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

### 2.2 Clone Repository
```bash
# Create deployment directory
sudo mkdir -p /opt/ems-deployment
sudo chown ubuntu:ubuntu /opt/ems-deployment

# Clone repository
cd /opt/ems-deployment
git clone https://github.com/infofitsoftwaresolution/ems-system.git .
```

## Step 3: Configure GitHub Secrets (10 minutes)

### 3.1 Go to Repository Settings
1. Navigate to: `https://github.com/infofitsoftwaresolution/ems-system/settings/secrets/actions`
2. Click "New repository secret"

### 3.2 Add Required Secrets

#### AWS Credentials
```
AWS_ACCESS_KEY_ID: Your AWS access key
AWS_SECRET_ACCESS_KEY: Your AWS secret key
AWS_REGION: us-east-1
```

#### EC2 Connection
```
EC2_HOST: your-ec2-public-ip
EC2_USERNAME: ubuntu
EC2_SSH_KEY: [Your private key content]
EC2_PORT: 22
```

#### Application Secrets
```
JWT_SECRET: [Generate with: openssl rand -base64 32]
GITHUB_TOKEN: [Your GitHub personal access token]
```

### 3.3 Create GitHub Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with scopes: `repo`, `write:packages`, `read:packages`

## Step 4: Deploy Application (5 minutes)

### 4.1 Manual Deployment (First Time)
```bash
# SSH into EC2
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Run deployment
cd /opt/ems-deployment
sudo ./deployment/scripts/deploy-to-ec2.sh
```

### 4.2 Verify Deployment
```bash
# Check status
sudo ./deployment/scripts/deploy-to-ec2.sh status

# Test endpoints
curl http://your-ec2-ip/api/health
curl http://your-ec2-ip/
```

## Step 5: Test CI/CD Pipeline

### 5.1 Make a Test Change
```bash
# Make a small change to trigger deployment
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test CI/CD deployment"
git push origin main
```

### 5.2 Monitor Deployment
1. Go to GitHub → Actions tab
2. Watch the workflow run
3. Check deployment status

## Verification Checklist

- [ ] EC2 instance is running
- [ ] Docker is installed and running
- [ ] Application is accessible at `http://your-ec2-ip`
- [ ] Backend API responds at `http://your-ec2-ip/api/health`
- [ ] GitHub Actions workflow completes successfully
- [ ] New changes deploy automatically

## Access Your Application

- **Frontend**: `http://your-ec2-ip`
- **Backend API**: `http://your-ec2-ip/api`
- **Health Check**: `http://your-ec2-ip/api/health`

## Next Steps

### 1. Set Up SSL (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 2. Configure Monitoring
```bash
# Check system status
sudo ./deployment/scripts/deploy-to-ec2.sh status

# View logs
sudo ./deployment/scripts/deploy-to-ec2.sh logs
```

### 3. Set Up Backups
```bash
# Create backup
sudo ./deployment/scripts/backup.sh

# Schedule automatic backups
sudo crontab -e
# Add: 0 2 * * * /opt/ems-deployment/deployment/scripts/backup.sh
```

## Troubleshooting

### Common Issues

#### 1. Deployment Fails
```bash
# Check logs
tail -f /var/log/ems-deployment.log

# Check GitHub Actions logs
# Go to repository → Actions tab
```

#### 2. Application Not Accessible
```bash
# Check if containers are running
docker ps

# Check firewall
sudo ufw status
```

#### 3. SSH Connection Issues
```bash
# Test SSH connection
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Check security group settings in AWS Console
```

## Support

- **Documentation**: Check `deployment/documentation/` folder
- **Issues**: Create GitHub issue
- **Logs**: Check `/var/log/ems-deployment.log`

## Security Notes

- Change default passwords
- Use strong SSH keys
- Enable firewall
- Regular security updates
- Monitor access logs

---

**Congratulations!** Your EMS system is now running with automated CI/CD. Any changes you push to the `main` branch will automatically deploy to your EC2 instance.
