# CI/CD Setup Guide for EMS Application

This guide will help you set up a complete CI/CD pipeline for your Employee Management System (EMS) application using GitHub Actions and AWS EC2.

## Prerequisites

1. **AWS EC2 Instance**: Running Amazon Linux 2 or Ubuntu
2. **GitHub Repository**: With your EMS code
3. **Docker**: Installed on your EC2 instance
4. **Docker Compose**: Installed on your EC2 instance
5. **SSH Access**: To your EC2 instance

## Step 1: Prepare Your EC2 Instance

### Install Docker and Docker Compose

```bash
# For Amazon Linux 2
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# For Ubuntu
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ubuntu
```

### Create Application Directory

```bash
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app
```

## Step 2: Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | `wJalr...` |
| `EC2_HOST` | Your EC2 public IP | `13.233.73.43` |
| `EC2_SSH_KEY` | Your SSH private key for EC2 access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `EC2_USERNAME` | EC2 username | `ec2-user` or `ubuntu` |
| `JWT_SECRET` | JWT secret for authentication | `your-super-secret-jwt-key` |

## Step 3: File Structure

Your repository should have the following structure:

```
EMS/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── deployment/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend.ssl
│   │   ├── nginx.conf
│   │   ├── nginx-ssl.conf.template
│   │   └── entrypoint.sh
│   └── scripts/
│       ├── setup-env.sh
│       ├── backup.sh
│       └── rollback.sh
└── ...
```

## Step 4: How the CI/CD Pipeline Works

### 1. **Test Stage**
- Runs on every push and pull request
- Installs dependencies for both backend and frontend
- Runs tests (if available)
- Builds the frontend application

### 2. **Deploy Stage**
- Only runs on pushes to the `main` branch
- Builds Docker images for backend and frontend
- Deploys to EC2 instance
- Performs health checks

### 3. **Deployment Process**
1. Builds Docker images using GitHub Actions
2. Copies files to EC2 instance
3. Loads Docker images on EC2
4. Starts containers using docker-compose
5. Verifies deployment with health checks

## Step 5: Manual Deployment Commands

If you need to deploy manually:

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to app directory
cd /home/ec2-user/app

# Run setup script
chmod +x deployment/scripts/setup-env.sh
./deployment/scripts/setup-env.sh

# Start the application
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs
```

## Step 6: Monitoring and Maintenance

### Health Checks

The pipeline includes automatic health checks:
- Backend health endpoint: `http://your-ec2-ip:3001/api/health`
- Frontend accessibility: `http://your-ec2-ip`

### Logs

View application logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Backup and Rollback

#### Create Backup
```bash
chmod +x deployment/scripts/backup.sh
./deployment/scripts/backup.sh
```

#### Rollback
```bash
chmod +x deployment/scripts/rollback.sh
./deployment/scripts/rollback.sh
```

## Step 7: SSL Setup (Optional)

If you want to enable SSL:

1. **Get SSL Certificates** (using Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

2. **Update Environment Variables**:
```bash
# In your EC2 instance
export SSL_ENABLED=true
export SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
export SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

3. **Restart Containers**:
```bash
docker-compose down
docker-compose up -d
```

## Step 8: Environment Variables

The following environment variables can be configured:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `DB_PATH` | Database path | `/app/database.sqlite` |
| `JWT_SECRET` | JWT secret key | `your-super-secret-jwt-key` |
| `PORT` | Backend port | `3001` |
| `BACKEND_URL` | Backend URL for frontend | `http://backend:3001` |
| `SSL_ENABLED` | Enable SSL | `false` |

## Troubleshooting

### Common Issues

1. **Docker Build Fails**
   - Check Dockerfile syntax
   - Verify package.json files
   - Check for missing dependencies

2. **Deployment Fails**
   - Verify GitHub secrets are correct
   - Check EC2 instance connectivity
   - Review GitHub Actions logs

3. **Application Not Accessible**
   - Check security groups (ports 80, 443, 3001)
   - Verify containers are running
   - Check nginx configuration

4. **Database Issues**
   - Ensure database file permissions
   - Check database path in environment variables
   - Verify SQLite installation

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs backend
docker-compose logs frontend

# Check nginx configuration
docker-compose exec frontend nginx -t

# Test backend health
curl http://localhost:3001/api/health

# Check environment variables
docker-compose exec backend env
```

## Security Considerations

1. **Change Default Secrets**: Update JWT_SECRET and other default values
2. **Use HTTPS**: Enable SSL for production deployments
3. **Firewall Rules**: Configure security groups properly
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **Backup Strategy**: Implement regular database backups

## Next Steps

1. **Set up monitoring**: Consider using AWS CloudWatch or similar
2. **Implement staging environment**: Test deployments before production
3. **Add notifications**: Set up Slack/email notifications for deployment status
4. **Database migrations**: Implement proper database migration strategy
5. **Load balancing**: Consider using Application Load Balancer for high availability

## Support

If you encounter any issues:
1. Check the GitHub Actions logs
2. Review the troubleshooting section
3. Check container logs on EC2
4. Verify all prerequisites are met

---

**Note**: This setup assumes you're using SQLite for the database. If you need PostgreSQL or MySQL, update the docker-compose.yml file accordingly.
