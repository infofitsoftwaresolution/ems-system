# Quick Deployment Guide - EC2 with Existing Repository

Since you've already cloned the repository on EC2, here's a quick guide to get the CI/CD pipeline working.

## ✅ What's Already Done

- ✅ Repository cloned on EC2
- ✅ CI/CD workflow created (`.github/workflows/deploy-ec2.yml`)
- ✅ RDS database configuration ready
- ✅ Docker Compose configuration updated for RDS

## 🚀 Quick Setup Steps

### 1. Configure GitHub Secrets

Go to your repository: **Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `EC2_USERNAME` | `ec2-user` | Your EC2 username |
| `EC2_SSH_KEY` | (Your .pem file content) | Full content of your SSH private key |
| `EC2_PORT` | `22` | SSH port (optional) |
| `JWT_SECRET` | (Generate with `openssl rand -base64 32`) | JWT secret key (optional) |

### 2. Verify EC2 Setup

SSH into your EC2 instance and verify:

```bash
ssh -i your-key.pem ec2-user@13.233.73.43

# Check if repository exists
cd /opt/ems-deployment
ls -la

# Check if Docker is installed
docker --version
docker-compose --version

# If Docker is not installed, run:
sudo yum update -y
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
```

### 3. Verify Repository Location

The CI/CD workflow expects the repository at `/opt/ems-deployment`. If you cloned it elsewhere:

```bash
# Option 1: Move your existing clone
sudo mkdir -p /opt/ems-deployment
sudo mv /path/to/your/existing/clone/* /opt/ems-deployment/
cd /opt/ems-deployment
git remote -v  # Verify remote is set correctly

# Option 2: Create symlink
sudo mkdir -p /opt
sudo ln -s /path/to/your/existing/clone /opt/ems-deployment
```

### 4. Ensure Git Remote is Correct

```bash
cd /opt/ems-deployment
git remote -v

# If remote is not set or incorrect:
git remote set-url origin https://github.com/infofitsoftwaresolution/ems-system.git

# Verify
git remote -v
```

### 5. Test the Deployment

Once GitHub secrets are configured, push your changes:

```bash
git add .
git commit -m "Setup CI/CD with RDS"
git push origin main
```

The workflow will:
1. ✅ Detect existing repository
2. ✅ Pull latest changes
3. ✅ Update environment with RDS config
4. ✅ Deploy using Docker Compose

## 🔍 Verify Deployment

After pushing, check GitHub Actions:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Watch the workflow run

Or check on EC2:

```bash
ssh -i your-key.pem ec2-user@13.233.73.43

# Check containers
cd /opt/ems-deployment
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Test backend
curl http://localhost:3001/api/health
```

## 📝 Important Notes

1. **Repository Location**: The workflow expects `/opt/ems-deployment`. If your clone is elsewhere, move it or update the workflow.

2. **Git Remote**: Make sure your repository has the correct remote URL pointing to `https://github.com/infofitsoftwaresolution/ems-system.git`

3. **Branch Name**: The workflow pulls from `main` branch. If you're using `master`, it will try both.

4. **Environment File**: The workflow will create/update `.env` file with RDS configuration. If you have custom values, they'll be preserved.

5. **Docker Images**: The workflow pulls images from GitHub Container Registry. Make sure your GitHub token has access.

## 🐛 Troubleshooting

### Issue: "Repository not found" or "Permission denied"

**Solution**: 
- Check SSH key in GitHub secrets
- Verify EC2_USERNAME is correct
- Ensure SSH key has correct permissions on EC2

### Issue: "Git pull failed"

**Solution**:
```bash
# On EC2, check git status
cd /opt/ems-deployment
git status
git remote -v

# Reset if needed
git fetch origin
git reset --hard origin/main
```

### Issue: "Docker not found"

**Solution**: Install Docker as shown in step 2 above.

### Issue: "Cannot connect to RDS"

**Solution**:
- Check RDS security group allows connections from EC2
- Verify RDS endpoint is correct
- Check database credentials

## 🎯 Next Steps

1. ✅ Configure GitHub secrets
2. ✅ Verify EC2 setup
3. ✅ Push code to trigger deployment
4. ✅ Monitor deployment in GitHub Actions
5. ✅ Verify application is running

---

**Need Help?** Check the full documentation in `CI_CD_SETUP.md`

