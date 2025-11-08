# Rural Samridhi EMS - Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB RAM available
- Ports 80 and 3001 available

### Windows Deployment
```powershell
# Run the PowerShell deployment script
.\deploy-production.ps1

# Or with options
.\deploy-production.ps1 -Force -SkipCleanup
```

### Linux/Mac Deployment
```bash
# Make script executable
chmod +x deploy-production.sh

# Run the deployment script
./deploy-production.sh
```

## 📋 What's Fixed

### ✅ Cleaned Up Files
- Removed unnecessary deployment scripts
- Removed duplicate configuration files
- Removed development-only files
- Cleaned up root directory

### ✅ Fixed Nginx Configuration
- Updated nginx.conf with proper production settings
- Added security headers
- Added rate limiting
- Added gzip compression
- Fixed proxy configuration

### ✅ Fixed Docker Compose
- Simplified docker-compose.production.yml
- Removed PostgreSQL dependency (using SQLite)
- Fixed environment variables
- Added proper health checks

### ✅ Fixed Login Issues
- Removed auto-filled admin credentials
- Updated login page to require manual input
- Removed demo credentials from UI

### ✅ Fixed Environment Configuration
- Created proper .env file structure
- Set production-ready defaults
- Configured security settings

## 🔧 Manual Deployment Steps

If the automated scripts don't work, follow these manual steps:

### 1. Stop Existing Services
```bash
docker-compose -f docker-compose.production.yml down
```

### 2. Create Environment File
Create `backend/.env` with the following content:
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-ems-2024-production
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
LOG_LEVEL=info
DEBUG=false
ENABLE_REQUEST_LOGGING=false
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:80
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Create Directories
```bash
mkdir -p uploads data logs
```

### 4. Start Services
```bash
docker-compose -f docker-compose.production.yml up --build -d
```

### 5. Verify Deployment
- Frontend: http://localhost:80
- Backend API: http://localhost:3001/api/health

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :80
netstat -tulpn | grep :3001

# Kill the process or change ports in docker-compose.production.yml
```

#### 2. Permission Issues
```bash
# Fix permissions
chmod 755 uploads data logs
```

#### 3. Database Issues
```bash
# Check if database file exists
ls -la backend/database.sqlite

# If missing, the app will create a new one
```

#### 4. Container Issues
```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Rebuild and restart
docker-compose -f docker-compose.production.yml up --build -d
```

## 📊 Monitoring

### Check Service Status
```bash
docker-compose -f docker-compose.production.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:80
```

## 🔒 Security Notes

1. **Change Default JWT Secret**: Update `JWT_SECRET` in the environment file
2. **Configure Email**: Set up proper SMTP credentials for email functionality
3. **Database Backup**: Regularly backup the SQLite database file
4. **SSL/HTTPS**: Configure SSL certificates for production use

## 📁 File Structure

```
EMS/
├── backend/
│   ├── .env                    # Environment configuration
│   ├── database.sqlite        # SQLite database
│   └── uploads/               # File uploads
├── frontend/
│   └── dist/                  # Built frontend files
├── nginx.conf                 # Nginx configuration
├── docker-compose.production.yml
├── deploy-production.sh      # Linux/Mac deployment
├── deploy-production.ps1     # Windows deployment
└── DEPLOYMENT_README.md      # This file
```

## 🆘 Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.production.yml logs -f`
2. Verify all services are running: `docker-compose -f docker-compose.production.yml ps`
3. Check port availability
4. Ensure Docker has enough resources allocated

## 🎯 Next Steps

1. Configure your domain name
2. Set up SSL certificates
3. Configure email settings
4. Set up database backups
5. Configure monitoring and logging


