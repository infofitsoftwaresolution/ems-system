# Rural Samridhi EMS - Employee Management System

A comprehensive Employee Management System built with React, Node.js, and SQLite, designed for rural development organizations.

## 🌟 Features

- **Employee Management** - Complete employee lifecycle management
- **KYC Verification** - Document verification and approval system
- **Attendance Tracking** - GPS-based check-in/check-out system
- **Leave Management** - Employee leave request and approval
- **Payslip Generation** - Automated salary slip generation
- **Email Notifications** - Automated email notifications
- **Admin Dashboard** - Comprehensive admin interface
- **Role-based Access** - Admin, Manager, and Employee roles

## 🚀 Quick Start

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/infofitsoftwaresolution/ems-system.git
   cd ems-system
   ```

2. **Start the application:**
   ```bash
   # Windows
   start-ems.bat
   
   # Linux/Mac
   chmod +x start-ems.sh
   ./start-ems.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Production Deployment

1. **Build for production:**
   ```bash
   chmod +x build-production.sh
   ./build-production.sh
   ```

2. **Deploy on EC2:**
   ```bash
   # On EC2 instance
   curl -O https://raw.githubusercontent.com/infofitsoftwaresolution/ems-system/main/deploy-ec2.sh
   chmod +x deploy-ec2.sh
   sudo ./deploy-ec2.sh
   ```

## 📋 Admin Credentials

- **Email:** s24346379@gmail.com
- **Password:** rsamriddhi@6287

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **React Router** - Client-side routing
- **Framer Motion** - Animation library

### Backend
- **Node.js 18** - JavaScript runtime
- **Express.js** - Web framework
- **Sequelize** - SQL ORM
- **SQLite** - Lightweight database
- **JWT** - Authentication
- **Nodemailer** - Email service
- **Multer** - File upload handling

### Production
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **SSL/TLS** - Secure connections
- **Rate Limiting** - API protection
- **Health Checks** - Monitoring

## 📁 Project Structure

```
ems-system/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.js       # Main server file
│   ├── uploads/            # File uploads
│   └── database.sqlite     # SQLite database
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
│   └── public/             # Static assets
├── deployment/              # Deployment files
├── nginx.production.conf   # Nginx configuration
├── docker-compose.production.yml
└── deploy-ec2.sh          # EC2 deployment script
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Production Configuration

For production deployment, use the provided configuration files:
- `production.env` - Production environment variables
- `nginx.production.conf` - Nginx configuration
- `docker-compose.production.yml` - Docker configuration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### KYC Management
- `GET /api/kyc` - Get all KYC submissions
- `POST /api/kyc` - Submit KYC
- `PUT /api/kyc/:id/status` - Update KYC status

### Attendance
- `GET /api/attendance/today` - Get today's attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out

### Leave Management
- `GET /api/leaves` - Get all leaves
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave

### Payslip Management
- `GET /api/payslips` - Get all payslips
- `POST /api/payslips` - Generate payslip
- `GET /api/payslips/:id/download` - Download payslip

## 🚀 Deployment

### Local Development
```bash
# Start both servers
start-ems.bat  # Windows
./start-ems.sh # Linux/Mac
```

### Production Deployment

1. **EC2 Amazon Linux 2:**
   ```bash
   sudo ./deploy-ec2.sh
   ```

2. **Docker:**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

3. **Manual:**
   ```bash
   ./start-production.sh
   ```

## 📈 Monitoring

### Health Checks
- Backend: http://localhost:3001/health
- Frontend: http://localhost:5173
- Production: https://app.rsamriddhi.com/health

### Logs
```bash
# Application logs
docker-compose logs -f

# System logs
journalctl -u ems -f
```

### Backup
```bash
# Manual backup
./backup-production.sh

# Automated backup (configured in production)
# Runs daily at 2 AM
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - API protection
- **Input Validation** - Data sanitization
- **File Upload Security** - Type and size validation
- **CORS Protection** - Cross-origin security
- **Security Headers** - XSS, CSRF protection

## 📱 Mobile Responsive

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the deployment guide

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] API documentation
- [ ] Performance optimization

---

**Built with ❤️ for Rural Development Organizations**