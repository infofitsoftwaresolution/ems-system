# Direct EC2 Deployment Guide

This guide shows you how to deploy your EMS application directly to EC2 using Docker, without relying on GitHub Actions.

## Prerequisites

1. **EC2 Instance**: Running Amazon Linux 2 or Ubuntu
2. **SSH Key**: Your EC2 SSH private key (.pem file)
3. **Docker**: Installed on your local machine
4. **SSH Client**: For connecting to EC2

## Quick Start

### Option 1: PowerShell (Recommended for Windows)

```powershell
# Set your SSH key path
$env:SSH_KEY_PATH = "C:\path\to\your\key.pem"

# Deploy the application
.\deploy-to-ec2.ps1 -SshKeyPath "C:\path\to\your\key.pem"
```

### Option 2: Batch File (Windows)

```cmd
# Set your SSH key path
set SSH_KEY_PATH=C:\path\to\your\key.pem

# Run the deployment
deploy-to-ec2.bat
```

### Option 3: Bash Script (Linux/Mac)

```bash
# Set your SSH key path
export SSH_KEY_PATH="/path/to/your/key.pem"

# Make the script executable
chmod +x deploy-to-ec2.sh

# Run the deployment
./deploy-to-ec2.sh
```

## What the Deployment Does

1. **Builds Docker Images**: Creates production-ready images for backend and frontend
2. **Uploads to EC2**: Transfers images and configuration files to your EC2 instance
3. **Sets Up Environment**: Creates necessary directories and environment variables
4. **Starts Services**: Launches the application using Docker Compose
5. **Health Checks**: Verifies that both frontend and backend are working

## Application Management

Use the management script to control your application:

```powershell
# Check application status
.\manage-ec2.ps1 -SshKeyPath "C:\path\to\your\key.pem" -Action status

# View logs
.\manage-ec2.ps1 -SshKeyPath "C:\path\to\your\key.pem" -Action logs

# Restart application
.\manage-ec2.ps1 -SshKeyPath "C:\path\to\your\key.pem" -Action restart

# Stop application
.\manage-ec2.ps1 -SshKeyPath "C:\path\to\your\key.pem" -Action stop

# Start application
.\manage-ec2.ps1 -SshKeyPath "C:\path\to\your\key.pem" -Action start

# Deploy new version
.\manage-ec2.ps1 -SshKeyPath "C:\path\to\your\key.pem" -Action deploy
```

## Manual Commands

If you prefer to run commands manually:

```bash
# SSH into your EC2 instance
ssh -i /path/to/your/key.pem ec2-user@13.233.73.43

# Navigate to app directory
cd /home/ec2-user/app

# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs

# Restart services
sudo docker-compose restart

# Stop services
sudo docker-compose down

# Start services
sudo docker-compose up -d
```

## Application URLs

Once deployed, your application will be available at:

- **Frontend**: http://13.233.73.43
- **Backend API**: http://13.233.73.43:3001/api
- **Health Check**: http://13.233.73.43:3001/api/health

## Environment Configuration

The deployment creates a `.env` file with the following settings:

```env
NODE_ENV=production
DB_PATH=/app/database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
BACKEND_URL=http://backend:3001
SSL_ENABLED=false
```

**Important**: Change the `JWT_SECRET` to a secure value in production!

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify your SSH key path is correct
   - Ensure your EC2 instance is running
   - Check security groups allow SSH (port 22)

2. **Docker Build Failed**
   - Ensure Docker is running on your local machine
   - Check that all required files exist
   - Verify you have enough disk space

3. **Application Not Accessible**
   - Check security groups allow ports 80 and 3001
   - Verify containers are running: `sudo docker-compose ps`
   - Check logs: `sudo docker-compose logs`

4. **Health Check Failed**
   - Wait a few minutes for services to fully start
   - Check backend logs: `sudo docker-compose logs backend`
   - Verify database is accessible

### Useful Commands

```bash
# Check container status
sudo docker-compose ps

# View all logs
sudo docker-compose logs

# View specific service logs
sudo docker-compose logs backend
sudo docker-compose logs frontend

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep docker
```

## Security Considerations

1. **Change Default Secrets**: Update JWT_SECRET and other sensitive values
2. **Use HTTPS**: Consider setting up SSL certificates
3. **Firewall Rules**: Configure security groups properly
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **Backup Strategy**: Implement regular database backups

## File Structure on EC2

```
/home/ec2-user/app/
├── docker-compose.yml
├── nginx.conf
├── entrypoint.sh
├── .env
├── uploads/
│   ├── kyc/
│   └── payslips/
└── ssl-certs/
```

## Next Steps

1. **Set up SSL**: Configure HTTPS for production use
2. **Domain Name**: Point your domain to the EC2 instance
3. **Monitoring**: Set up application monitoring
4. **Backups**: Implement automated backup strategy
5. **Load Balancing**: Consider using Application Load Balancer for high availability

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the application logs
3. Verify your EC2 instance configuration
4. Ensure all prerequisites are met
