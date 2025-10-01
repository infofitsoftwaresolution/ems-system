# 🏢 Rural Samridhi Employee Management System (EMS)

A comprehensive Employee Management System built with React and Node.js, designed for Rural Samridhi organization. This system includes KYC verification, attendance tracking, leave management, payroll processing, and more.

## 🌟 Features

### 👥 Employee Management
- Complete employee lifecycle management
- Employee profile with KYC verification
- Role-based access control
- Employee data export and reporting

### 🔐 KYC (Know Your Customer) System
- Document upload (PAN, Aadhaar, etc.)
- Admin approval workflow
- Status tracking and notifications
- Secure document storage

### ⏰ Attendance Management
- Check-in/Check-out with live location tracking
- Attendance history and reports
- GPS-based location verification
- Real-time attendance dashboard

### 🏖️ Leave Management
- Leave application and approval workflow
- Leave balance tracking
- Leave history and reports
- Email notifications

### 💰 Payroll Management
- Payslip generation
- Salary calculations
- Payment history
- PDF payslip generation

### 📧 Communication
- Email notifications for all activities
- KYC approval/rejection notifications
- Leave application notifications
- System alerts and reminders

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/infofitsoftwaresolution/ems-system.git
   cd ems-system
   ```

2. **One-command setup**
   ```bash
   npm run setup
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Default Login Credentials

#### Admin Account
- **Email**: `admin@ruralsamridhi.com`
- **Password**: `admin123`

#### Test Employee Account
- **Email**: `employee@ruralsamridhi.com`
- **Password**: `employee123`

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible component library
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for database
- **SQLite** - Database (easily switchable to PostgreSQL)
- **JWT** - Authentication
- **Nodemailer** - Email service
- **Multer** - File upload handling

## 📁 Project Structure

```
ems-system/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Authentication & validation
│   │   └── services/       # Email & other services
│   ├── uploads/            # File uploads
│   └── database.sqlite     # SQLite database
├── frontend/Modern-EMS/    # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── page/          # Page components
│   │   ├── lib/           # Utilities & context
│   │   └── hooks/         # Custom hooks
├── deployment/            # Deployment scripts
└── docs/                 # Documentation
```

## 🔧 Available Scripts

### Root Level Commands
```bash
npm run install-all    # Install all dependencies
npm run dev           # Start both servers in development
npm run start         # Start both servers in production
npm run build         # Build frontend for production
npm run setup         # Complete setup (install + seed)
npm run clean         # Remove all node_modules
npm run reset         # Clean + setup (fresh start)
```

### Backend Commands
```bash
cd backend
npm run dev          # Start development server
npm run start        # Start production server
npm run test         # Run API tests
npm run seed         # Seed database
npm run seed:kyc     # Seed KYC data
npm run reset-db     # Reset database
```

### Frontend Commands
```bash
cd frontend/Modern-EMS
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📧 Email Configuration

To enable email functionality:

1. Copy `backend/env.example` to `backend/.env`
2. Configure Gmail SMTP settings:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   ```
3. Restart the backend server

## 🧪 Testing

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ruralsamridhi.com", "password": "admin123"}'
```

### Email Testing
```bash
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "emailType": "newEmployee"}'
```

## 🚀 Deployment

### Docker Deployment
```bash
cd deployment/docker
docker-compose up -d
```

### AWS Deployment
See `deployment/scripts/` for AWS deployment scripts.

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [Team Quick Start](TEAM_QUICK_START.md) - Quick setup for team members
- [API Documentation](API_Endpoints_Documentation.md) - Complete API reference
- [Deployment Guide](DEPLOYMENT_SUMMARY.md) - Deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**InfoFit Software Solution**
- Repository: https://github.com/infofitsoftwaresolution/ems-system
- Issues: https://github.com/infofitsoftwaresolution/ems-system/issues

## 🆘 Support

For support and questions:
1. Check the [Setup Guide](SETUP_GUIDE.md)
2. Review [Troubleshooting](TROUBLESHOOTING.md)
3. Create an [issue](https://github.com/infofitsoftwaresolution/ems-system/issues)

---

**Built with ❤️ by InfoFit Software Solution**