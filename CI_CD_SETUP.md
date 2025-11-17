# CI/CD Pipeline Setup Guide for EC2 with RDS

This guide explains how to set up the CI/CD pipeline for deploying the Rural Samriddhi EMS to EC2 with RDS PostgreSQL database.

## 📋 Prerequisites

1. **GitHub Repository**: `https://github.com/infofitsoftwaresolution/ems-system`
2. **EC2 Instance**: `13.233.73.43`
3. **RDS Database**: 
   - Host: `rsamriddhi.c3ea24kmsrmf.ap-south-1.rds.amazonaws.com`
   - Database: `rsamriddhi`
   - User: `postgres`
   - Password: `rsamriddhi1234`

## 🔧 GitHub Secrets Configuration

You need to configure the following secrets in your GitHub repository:

### Required Secrets

1. **EC2_USERNAME**
   - Value: `ec2-user` (for Amazon Linux) or `ubuntu` (for Ubuntu)
   - Location: Repository Settings → Secrets and variables → Actions

2. **EC2_SSH_KEY**
   - Value: Your private SSH key content (entire content including `-----BEGIN` and `-----END`)
   - How to get: Copy the content of your `.pem` file

3. **EC2_PORT** (Optional)
   - Value: `22` (default SSH port)

4. **JWT_SECRET** (Optional, but recommended)
   - Value: A strong secret key for JWT tokens
   - Generate: `openssl rand -base64 32`

5. **SMTP_USER** (Optional)
   - Value: Your email address for sending emails

6. **SMTP_PASS** (Optional)
   - Value: Your email app password

### How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name listed above

## 🚀 Initial EC2 Setup

Before running the CI/CD pipeline, you need to set up your EC2 instance:

### Step 1: Connect to EC2

```bash
ssh -i your-key.pem ec2-user@13.233.73.43
```

### Step 2: Install Docker and Docker Compose

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Log out and log back in for group changes to take effect
exit
```

### Step 3: Create Deployment Directory

```bash
ssh -i your-key.pem ec2-user@13.233.73.43

sudo mkdir -p /opt/ems-deployment
sudo chown -R ec2-user:ec2-user /opt/ems-deployment
cd /opt/ems-deployment
```

### Step 4: Configure Security Groups

Ensure your EC2 security group allows:
- **SSH (22)**: From your IP or GitHub Actions IPs
- **HTTP (80)**: From anywhere (0.0.0.0/0)
- **HTTPS (443)**: From anywhere (0.0.0.0/0)
- **Backend API (3001)**: From anywhere (0.0.0.0/0) or just from Nginx

Ensure your RDS security group allows:
- **PostgreSQL (5432)**: From your EC2 security group

## 🔄 CI/CD Pipeline Workflow

The CI/CD pipeline (`.github/workflows/deploy-ec2.yml`) performs the following steps:

1. **Build & Test**
   - Installs dependencies
   - Runs linting
   - Builds frontend
   - Builds Docker images

2. **Push Images**
   - Pushes images to GitHub Container Registry (GHCR)

3. **Deploy to EC2**
   - Connects to EC2 via SSH
   - Pulls latest code
   - Sets up environment with RDS configuration
   - Pulls Docker images from GHCR
   - Deploys using Docker Compose
   - Runs health checks

## 📝 Manual Deployment

If you need to deploy manually:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@13.233.73.43

# Run deployment script
cd /opt/ems-deployment
chmod +x deployment/scripts/deploy-ec2-rds.sh
./deployment/scripts/deploy-ec2-rds.sh deploy
```

## 🔍 Monitoring and Troubleshooting

### Check Deployment Status

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@13.233.73.43

# Check container status
cd /opt/ems-deployment
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check backend health
curl http://localhost:3001/api/health
```

### Common Issues

#### 1. Connection to RDS Fails

**Check:**
- RDS security group allows connections from EC2
- RDS endpoint is correct
- Database credentials are correct
- SSL is properly configured

**Solution:**
```bash
# Test RDS connection from EC2
psql -h rsamriddhi.c3ea24kmsrmf.ap-south-1.rds.amazonaws.com -U postgres -d rsamriddhi
```

#### 2. Docker Images Not Found

**Check:**
- Images are pushed to GHCR
- GitHub token has correct permissions
- Image names match in docker-compose.yml

**Solution:**
```bash
# Login to GHCR manually
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull images manually
docker pull ghcr.io/infofitsoftwaresolution/ems-system-backend:latest
docker pull ghcr.io/infofitsoftwaresolution/ems-system-frontend:latest
```

#### 3. Health Check Fails

**Check:**
- Backend container is running
- Backend can connect to RDS
- Port 3001 is accessible

**Solution:**
```bash
# Check backend logs
docker-compose -f docker-compose.production.yml logs backend

# Check if backend is running
docker ps | grep ems-backend

# Test backend directly
curl http://localhost:3001/api/health
```

## 🔐 Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for sensitive information
3. **Rotate secrets regularly**
4. **Limit SSH access** to specific IPs
5. **Use strong JWT secrets**
6. **Enable SSL/TLS** for production
7. **Keep Docker images updated**

## 📊 Deployment Commands

The deployment script supports several commands:

```bash
# Deploy application
./deployment/scripts/deploy-ec2-rds.sh deploy

# Check status
./deployment/scripts/deploy-ec2-rds.sh status

# View logs
./deployment/scripts/deploy-ec2-rds.sh logs

# Restart services
./deployment/scripts/deploy-ec2-rds.sh restart

# Stop services
./deployment/scripts/deploy-ec2-rds.sh stop

# Cleanup old images
./deployment/scripts/deploy-ec2-rds.sh cleanup
```

## 🎯 Next Steps

1. **Set up GitHub Secrets** as described above
2. **Run initial EC2 setup** if not already done
3. **Push code to main branch** to trigger deployment
4. **Monitor deployment** in GitHub Actions tab
5. **Verify application** is running at `http://13.233.73.43`

## 📞 Support

For issues or questions:
1. Check GitHub Actions logs
2. Check EC2 container logs
3. Verify all secrets are configured
4. Review this documentation

---

**Note**: Make sure your RDS database is accessible from your EC2 instance and that all security groups are properly configured.

