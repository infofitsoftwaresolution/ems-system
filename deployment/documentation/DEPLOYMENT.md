# Deployment Guide

## GitHub Repository Setup

### 1. Create GitHub Repository
- Go to [GitHub.com](https://github.com) → Create new repository
- **Name**: `employee-management-system`
- **Description**: Full-stack employee management system with React, Node.js, Docker, and AWS ECR deployment
- **Visibility**: Private (recommended for production)
- **Don't initialize** with README (you already have files)

### 2. Push Code to GitHub

```bash
# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/infofitsoftwaresolution/ems-system.git

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Employee Management System with React, Node.js, Docker, AWS ECR deployment"

# Set main branch and push
git branch -M main
git push -u origin main
```

## GitHub Secrets Configuration

### Required Secrets
Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | `AKIA3KCPOGFRBTY7OOX4` | AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | `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` | AWS Secret Access Key |
| `EC2_HOST` | `13.233.73.43` | EC2 Instance IP Address |
| `EC2_SSH_KEY` | Content of `jail.pem` file | EC2 SSH Private Key |

### How to Add EC2_SSH_KEY Secret
1. Open the `jail.pem` file in a text editor
2. Copy the entire content (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)
3. Paste it as the value for `EC2_SSH_KEY` secret

## CI/CD Pipeline

### Workflow Features
- **Automatic Testing**: Runs on every push and pull request
- **Docker Build**: Builds and pushes images to ECR
- **Automatic Deployment**: Deploys to EC2 on main branch pushes
- **Image Cleanup**: Removes old Docker images to save space

### Pipeline Steps
1. **Test Job**: 
   - Installs dependencies
   - Runs frontend and backend tests
   - Only proceeds to deploy if tests pass

2. **Deploy Job** (main branch only):
   - Builds Docker images
   - Pushes to AWS ECR
   - Deploys to EC2 instance
   - Cleans up old images

## Manual Deployment Commands

### Local Development
```bash
# Start backend
cd server
npm run dev

# Start frontend (new terminal)
cd employee-management
npm start
```

### Production Deployment
```bash
# On EC2 instance
cd /path/to/your/app
docker-compose down
docker-compose pull
docker-compose up -d
```

## Environment Variables

### Backend (.env)
```env
PORT=3001
CLIENT_ORIGIN=http://13.233.73.43.nip.io
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ems
POSTGRES_USER=postgres
POSTGRES_PASSWORD=root
JWT_SECRET=your-jwt-secret
```

### Frontend
Update API base URL in `employee-management/src/services/api.js`:
```javascript
const API_BASE_URL = 'http://13.233.73.43.nip.io:3001';
```

## Monitoring and Logs

### View Application Logs
```bash
# Docker logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Check
- **Frontend**: http://13.233.73.43.nip.io
- **Backend API**: http://13.233.73.43.nip.io:3001/api/health

## Troubleshooting

### Common Issues

1. **GitHub Actions Failing**:
   - Check if all secrets are properly set
   - Verify AWS credentials have ECR permissions
   - Ensure EC2 instance is running

2. **Deployment Issues**:
   - Check EC2 instance logs: `docker-compose logs`
   - Verify ECR repository access
   - Ensure docker-compose.yml is correct

3. **Application Not Accessible**:
   - Check security groups allow HTTP/HTTPS traffic
   - Verify nginx configuration
   - Check if containers are running: `docker ps`

### Useful Commands
```bash
# Check running containers
docker ps

# View container logs
docker logs <container_name>

# Restart services
docker-compose restart

# Update and restart
docker-compose down && docker-compose up -d
```

## Security Notes

- Keep AWS credentials secure
- Use environment variables for sensitive data
- Regularly update dependencies
- Monitor application logs for security issues
- Use HTTPS in production (SSL setup available)

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review application logs on EC2
3. Verify all secrets are correctly set
4. Ensure AWS permissions are properly configured
