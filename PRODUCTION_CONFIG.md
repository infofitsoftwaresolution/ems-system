# Rural Samridhi EMS - Production Configuration

## 🌐 Production URLs and Endpoints

### Application URLs
- **Frontend:** https://app.rsamriddhi.com
- **Backend API:** https://app.rsamriddhi.com/api
- **Health Check:** https://app.rsamriddhi.com/api/health

### API Endpoints (All paths are fixed and will not change)

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/set-password` - Set new password

#### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

#### KYC Management
- `GET /api/kyc` - Get all KYC submissions
- `POST /api/kyc` - Submit KYC
- `GET /api/kyc/:id` - Get KYC by ID
- `PUT /api/kyc/:id/status` - Update KYC status
- `GET /api/kyc/file/:filename` - Download KYC file

#### Attendance
- `GET /api/attendance/today` - Get today's attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/history` - Get attendance history

#### Leave Management
- `GET /api/leaves` - Get all leaves
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave
- `DELETE /api/leaves/:id` - Delete leave

#### Payslip Management
- `GET /api/payslips` - Get all payslips
- `POST /api/payslips` - Generate payslip
- `GET /api/payslips/:id` - Get payslip by ID
- `GET /api/payslips/:id/download` - Download payslip

#### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔧 Environment Configuration

### Backend Environment Variables
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.rsamriddhi.com
JWT_SECRET=your-super-secret-jwt-key-ems-2024-production
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
LOG_LEVEL=info
DEBUG=false
ENABLE_REQUEST_LOGGING=true
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SMTP_USER=s24346379@gmail.com
SMTP_PASS=edufxpcbkumsnsyo
```

### Frontend Environment Variables
```env
NODE_ENV=production
VITE_API_URL=https://app.rsamriddhi.com/api
VITE_APP_URL=https://app.rsamriddhi.com
```

## 🐳 Docker Configuration

### Backend Dockerfile
- **Base Image:** node:18-alpine
- **Port:** 3001
- **Health Check:** /health endpoint
- **Volumes:** uploads, database, logs

### Frontend Dockerfile
- **Base Image:** node:18-alpine
- **Port:** 5173
- **Build:** Production build with serve
- **Health Check:** Root endpoint

### Nginx Configuration
- **Domain:** app.rsamriddhi.com
- **SSL:** Ready for Let's Encrypt
- **Rate Limiting:** API protection
- **Caching:** Static file optimization
- **Security Headers:** Full security implementation

## 🔒 Security Features

### Rate Limiting
- **API Routes:** 10 requests/second
- **Login Routes:** 5 requests/minute
- **File Uploads:** 5 requests/minute

### Security Headers
- **X-Frame-Options:** SAMEORIGIN
- **X-Content-Type-Options:** nosniff
- **X-XSS-Protection:** 1; mode=block
- **Content-Security-Policy:** Strict CSP
- **HSTS:** Ready for HTTPS

### File Upload Security
- **Max File Size:** 10MB
- **Allowed Types:** PDF, JPG, PNG, DOC, DOCX
- **Storage:** Secure uploads directory
- **Access Control:** Authenticated users only

## 📊 Monitoring and Logging

### Health Checks
- **Backend:** http://localhost:3001/health
- **Frontend:** http://localhost:5173
- **Nginx:** http://localhost/health

### Log Files
- **Application Logs:** ./backend/logs/
- **Nginx Logs:** /var/log/nginx/
- **Docker Logs:** docker-compose logs

### Monitoring Scripts
- **Health Check:** ./health-check.sh
- **Backup:** ./backup-production.sh
- **Service Status:** systemctl status

## 🚀 Deployment Process

### 1. GitHub Repository
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

### 2. EC2 Deployment
```bash
# On EC2 instance
curl -O https://raw.githubusercontent.com/yourusername/rural-samriddhi-ems/main/deploy-ec2.sh
chmod +x deploy-ec2.sh
sudo ./deploy-ec2.sh
```

### 3. Domain Configuration
- **DNS A Record:** app.rsamriddhi.com → 13.233.73.43
- **SSL Certificate:** Let's Encrypt (optional)

### 4. Application Initialization
```bash
cd /opt/ems/backend
sudo -u ec2-user node src/seed.js
sudo systemctl restart ems
```

## 🔄 Backup and Recovery

### Automated Backups
- **Database:** Daily at 2 AM
- **Uploads:** Daily at 2 AM
- **Logs:** Daily at 2 AM
- **Retention:** 7 days

### Manual Backup
```bash
./backup-production.sh
```

### Recovery Process
```bash
# Restore database
cp backups/database_YYYYMMDD_HHMMSS.sqlite backend/database.sqlite

# Restore uploads
tar -xzf backups/uploads_YYYYMMDD_HHMMSS.tar.gz

# Restart services
sudo systemctl restart ems
```

## 📈 Performance Optimization

### Nginx Optimizations
- **Gzip Compression:** Enabled
- **Static File Caching:** 1 year
- **Keep-Alive:** 65 seconds
- **Client Limits:** 10MB max body

### Database Optimizations
- **SQLite:** Production-ready
- **Indexes:** Optimized queries
- **Vacuum:** Regular cleanup
- **Backup:** Automated daily

### Application Optimizations
- **Node.js:** Production mode
- **Memory:** Optimized heap
- **Logging:** Structured logs
- **Error Handling:** Comprehensive

## 🛠️ Maintenance

### Regular Tasks
- **Log Rotation:** Automated
- **Database Cleanup:** Weekly
- **Security Updates:** Monthly
- **Backup Verification:** Daily

### Update Process
```bash
cd /opt/ems
sudo -u ec2-user git pull origin main
sudo systemctl restart ems
```

### Troubleshooting
- **Service Status:** systemctl status ems
- **Logs:** journalctl -u ems -f
- **Health Check:** ./health-check.sh
- **Database:** Check SQLite integrity

---

## ✅ Production Checklist

- [ ] Domain configured (app.rsamriddhi.com)
- [ ] DNS pointing to EC2 IP (13.233.73.43)
- [ ] SSL certificate installed (optional)
- [ ] Environment variables configured
- [ ] Database initialized with admin user
- [ ] Email service configured
- [ ] Backup system working
- [ ] Monitoring scripts active
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] File upload working
- [ ] All API endpoints accessible
- [ ] Frontend loading correctly
- [ ] Health checks passing

**Your Rural Samridhi EMS is now production-ready!** 🎉


