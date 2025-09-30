# Employee Management System - Docker Build Fixed

A full-stack employee management system with React frontend and Node.js/PostgreSQL backend.

## Project Structure

```
SRS/
├── 📁 backend/                    # Backend Services
│   ├── 📁 src/                   # Source code
│   │   ├── 📁 middleware/        # Authentication middleware
│   │   ├── 📁 models/           # Sequelize models
│   │   ├── 📁 routes/           # API routes
│   │   ├── 📁 services/         # Business logic services
│   │   ├── 📄 server.js         # Main server file
│   │   ├── 📄 sequelize.js      # Database configuration
│   │   └── 📄 seed.js           # Database seeding
│   ├── 📁 uploads/              # File uploads directory
│   ├── 📄 .env                  # Environment variables (create this)
│   ├── 📄 database.sqlite       # Database file (auto-generated)
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   └── 📄 README.md
│
├── 📁 frontend/                   # Frontend Applications
│   ├── 📁 build/                # Build output (auto-generated)
│   ├── 📁 public/               # Static assets
│   ├── 📁 src/                  # Source code
│   │   ├── 📁 components/       # Reusable UI components
│   │   ├── 📁 pages/           # Page components
│   │   ├── 📁 services/        # API services
│   │   └── ...
│   ├── 📁 node_modules/         # Dependencies (auto-generated)
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   └── 📄 README.md
│
├── 📁 deployment/                 # Deployment Configuration
│   ├── 📁 docker/               # Docker configuration
│   │   ├── 📄 docker-compose.yml
│   │   ├── 📄 Dockerfile.backend
│   │   ├── 📄 Dockerfile.frontend
│   │   ├── 📄 Dockerfile.frontend.ssl
│   │   ├── 📄 nginx.conf
│   │   ├── 📄 nginx.conf.template
│   │   ├── 📄 nginx-ssl.conf.template
│   │   └── 📄 entrypoint.sh
│   ├── 📁 scripts/              # Deployment scripts
│   │   ├── 📄 aws-deploy.sh
│   │   ├── 📄 deploy-aws.bat
│   │   ├── 📄 setup-ssl.sh
│   │   ├── 📄 setup-ssl.bat
│   │   └── 📄 start-servers.bat
│   └── 📁 documentation/        # Deployment docs
│       ├── 📄 DEPLOYMENT.md
│       ├── 📄 deploy-aws.md
│       ├── 📄 EMAIL_SETUP_GUIDE.md
│       └── 📄 SSL_SETUP_GUIDE.md
│
├── 📁 scripts/                    # Utility Scripts
│   └── 📄 test-apis.ps1         # API testing script
│
├── 📁 terraform/                  # Infrastructure as Code
│   ├── 📄 main.tf
│   ├── 📄 variables.tf
│   └── 📄 terraform.tfvars.example
│
├── 📄 .dockerignore
├── 📄 .gitignore
└── 📄 README.md                  # This file
```

## Features

### Frontend (React)
- **Dashboard**: Analytics overview with calendar integration
- **Employee Management**: Add, edit, delete employees
- **Site Administration**: Comprehensive admin panel
- **KYC System**: Document upload and review
- **Attendance Tracking**: Check-in/check-out functionality
- **Leave Management**: Apply and review leave requests
- **User Authentication**: Login with role-based access
- **Responsive Design**: Modern UI with mobile support

### Backend (Node.js + PostgreSQL)
- **RESTful API**: Complete CRUD operations
- **Authentication**: JWT-based authentication
- **File Uploads**: KYC document handling
- **Database**: PostgreSQL with Sequelize ORM
- **Security**: Password hashing, CORS, Helmet

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Quick Start

### 1. Database Setup

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE ems;

-- Create user (optional)
CREATE USER ems_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ems TO ems_user;
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
echo "PORT=3001
CLIENT_ORIGIN=http://localhost:3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ems
POSTGRES_USER=postgres
POSTGRES_PASSWORD=root
JWT_SECRET=dev-secret" > .env

# Seed the database
node src/seed.js

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### 4. Using Deployment Scripts

For easier development, you can use the provided scripts:

```bash
# Start both servers (Windows)
deployment/scripts/start-servers.bat

# Or manually start each service
cd backend && npm run dev
cd frontend && npm start
```

## Default Users

After seeding the database, you can login with:

### Admin User
- **Email**: `admin@company.com`
- **Password**: `admin123`

### Manager User
- **Email**: `manager@company.com`
- **Password**: `manager123`

### Employee User
- **Email**: `employee@company.com`
- **Password**: `employee123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/updatePassword` - Update password

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### KYC
- `POST /api/kyc` - Submit KYC documents
- `GET /api/kyc` - Get KYC submissions
- `POST /api/kyc/:id/review` - Review KYC

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/today` - Get today's attendance

### Leave
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves/:id/review` - Review leave

## API Testing

To test the API endpoints, use the PowerShell script:

```powershell
cd scripts
.\test-apis.ps1
```

Make sure the backend server is running before executing API tests.

## Docker Deployment

### Development with Docker

```bash
# Navigate to docker directory
cd deployment/docker

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build and start production containers
docker-compose -f docker-compose.yml up -d --build

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:3001
```

## File Structure Details

### Frontend Components
- `Header.js` - Application header with search and notifications
- `Sidebar.js` - Navigation sidebar with role-based menu
- `Calendar.js` - Moodle-like calendar with analytics
- `Dashboard.js` - Main dashboard with statistics and widgets

### Frontend Pages
- `Login.js` - Authentication page
- `Dashboard.js` - Main dashboard
- `Employees.js` - Employee listing and management
- `AddEmployee.js` - Add new employee form
- `SiteAdmin.js` - Site administration panel
- `KycSubmit.js` - KYC document submission
- `KycReview.js` - KYC review for admins
- `LeaveApply.js` - Leave application form
- `LeaveReview.js` - Leave review for managers

### Backend Models
- `User.js` - User authentication model
- `Employee.js` - Employee data model
- `Kyc.js` - KYC document model
- `Attendance.js` - Attendance tracking model
- `Leave.js` - Leave request model
- `Event.js` - Calendar events model

### Backend Routes
- `auth.js` - Authentication routes
- `employees.js` - Employee management routes
- `kyc.js` - KYC document routes
- `attendance.js` - Attendance routes
- `leaves.js` - Leave management routes

## Troubleshooting

### Common Issues

1. **"Failed to fetch" Error**:
   - Ensure backend is running on port 3001
   - Check if PostgreSQL is running
   - Verify database connection settings

2. **Database Connection Error**:
   - Check PostgreSQL service is running
   - Verify database credentials in .env file
   - Ensure database 'ems' exists

3. **Port Already in Use**:
   - Kill existing Node.js processes
   - Use different ports in .env file

4. **File Upload Issues**:
   - Ensure uploads directory exists in backend folder
   - Check file permissions

5. **Docker Issues**:
   - Ensure Docker is running
   - Check if ports 80 and 3001 are available
   - Verify docker-compose.yml paths are correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.#   C I / C D   T e s t   -   0 9 / 3 0 / 2 0 2 5   1 7 : 3 7 : 2 2  
 