# CI/CD Troubleshooting Guide

## Common Issues and Solutions

### 1. SSH Connection Issues

**Symptoms**: Workflow fails immediately (13-16 seconds)
**Causes**:
- Incorrect EC2_HOST (public IP)
- Wrong EC2_USERNAME (should be `ec2-user` for Amazon Linux)
- Invalid EC2_SSH_KEY (private key content)
- EC2 instance not running
- Security group blocking SSH (port 22)

**Solutions**:
```bash
# Test SSH connection manually
ssh -i "your-key.pem" ec2-user@YOUR_EC2_IP

# Check EC2 instance status in AWS Console
# Verify security group allows SSH (port 22) from your IP
```

### 2. GitHub Secrets Issues

**Symptoms**: Connection timeout or authentication failure
**Causes**:
- Missing or incorrect secrets
- Wrong secret names
- Invalid secret values

**Required Secrets**:
- `EC2_HOST`: Your EC2 public IP
- `EC2_USERNAME`: `ec2-user` (for Amazon Linux)
- `EC2_SSH_KEY`: Your private key content (including -----BEGIN and -----END lines)
- `EC2_PORT`: `22`

### 3. EC2 Instance Issues

**Symptoms**: Connection works but commands fail
**Causes**:
- Instance not running
- Out of disk space
- Network issues
- User permissions

**Solutions**:
```bash
# Check instance status
aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID

# Check disk space
df -h

# Check system resources
free -h
top
```

### 4. Docker Issues

**Symptoms**: Docker commands fail
**Causes**:
- Docker not installed
- Docker not running
- Permission issues
- User not in docker group

**Solutions**:
```bash
# Install Docker
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# Log out and back in to apply group changes
exit
ssh -i "your-key.pem" ec2-user@YOUR_EC2_IP

# Test Docker
docker --version
docker ps
```

### 5. Git Issues

**Symptoms**: Git commands fail
**Causes**:
- Git not installed
- Repository access issues
- Network connectivity

**Solutions**:
```bash
# Install Git
sudo dnf install -y git

# Test Git
git --version
git clone https://github.com/infofitsoftwaresolution/ems-system.git test-repo
```

## Manual Deployment Steps

If CI/CD continues to fail, you can deploy manually:

```bash
# SSH into EC2
ssh -i "your-key.pem" ec2-user@YOUR_EC2_IP

# Install dependencies
sudo dnf update -y
sudo dnf install -y git curl wget

# Install Docker
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Create deployment directory
sudo mkdir -p /opt/ems-deployment
sudo chown ec2-user:ec2-user /opt/ems-deployment

# Clone repository
cd /opt/ems-deployment
git clone https://github.com/infofitsoftwaresolution/ems-system.git .

# Deploy application
sudo docker-compose up -d --build

# Check status
sudo docker-compose ps
curl http://localhost/api/health
```

## Testing Your Setup

Run the diagnostic workflow to identify issues:
1. Go to GitHub Actions
2. Click "Diagnose Connection Issues"
3. Click "Run workflow"
4. Check the logs for specific error messages

## Getting Help

If you're still having issues:
1. Check the diagnostic workflow logs
2. Verify your EC2 instance is running
3. Test SSH connection manually
4. Check GitHub secrets are correct
5. Review AWS security group settings
