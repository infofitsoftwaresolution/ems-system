# 🚀 Rural Samridhi EMS - Team Setup Guide

## 📋 Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git** (for cloning the repository)

## 🛠️ Quick Setup (One Command)

```bash
# Clone the repository
git clone https://github.com/infofitsoftwaresolution/ems-system.git
cd ems-system

# Install all dependencies and setup database
npm run setup
```

## 📦 Manual Setup Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/Modern-EMS
npm install
```

### 2. Environment Configuration

Create `.env` file in the `backend` directory:

```bash
# Copy the template
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ems_database
DB_USER=your_db_user
DB_PASS=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Email Configuration (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### 3. Database Setup

```bash
# Navigate to backend directory
cd backend

# Seed the database with initial data
npm run seed

# Seed KYC data
npm run seed:kyc
```

### 4. Start Development Servers

```bash
# From root directory - starts both servers
npm run dev

# Or start individually:
# Backend (Terminal 1)
npm run dev:backend

# Frontend (Terminal 2)
npm run dev:frontend
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 👥 Default Login Credentials

### Admin Account
- **Email**: admin@ruralsamridhi.com
- **Password**: admin123

### Test Employee Account
- **Email**: employee@ruralsamridhi.com
- **Password**: employee123

## 📁 Project Structure

```
rural-samridhi-ems/
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
└── deployment/            # Deployment scripts
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

## 🧪 Testing the System

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

### 2. Test Email Functionality
```bash
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "emailType": "newEmployee"
  }'
```

### 3. Test Authentication
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ruralsamridhi.com",
    "password": "admin123"
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 3001 and 5173
   npx kill-port 3001 5173
   ```

2. **Database Issues**
   ```bash
   # Reset database
   cd backend
   npm run reset-db
   ```

3. **Node Modules Issues**
   ```bash
   # Clean install
   npm run clean
   npm run install-all
   ```

4. **Email Not Working**
   - Check Gmail app password setup
   - Verify SMTP credentials in `.env`
   - Test email configuration: `GET /api/email/config`

### Logs and Debugging

- **Backend logs**: Check terminal running `npm run dev:backend`
- **Frontend logs**: Check browser console and terminal running `npm run dev:frontend`
- **Database**: SQLite file at `backend/database.sqlite`

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `SMTP_PASS` environment variable

## 🚀 Production Deployment

See `deployment/` directory for:
- Docker setup
- AWS deployment scripts
- SSL configuration
- CI/CD pipeline

## 📞 Support

For issues or questions:
1. Check this setup guide
2. Review the troubleshooting section
3. Check existing issues in the repository
4. Create a new issue with detailed information

---

**Happy Coding! 🎉**
