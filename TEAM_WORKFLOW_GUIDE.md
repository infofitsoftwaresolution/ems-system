# 🚀 Rural Samridhi EMS - Team Workflow Guide

## 📁 Clean Project Structure

```
EMS/
├── backend/                 # Backend API (Node.js + Express + SQLite)
├── frontend/               # Frontend React App (Vite + React 19)
├── package.json           # Root package.json with workspace scripts
└── README.md              # Main documentation
```

## 🛠️ Quick Start Commands

### For New Team Members
```bash
# 1. Clone the repository
git clone <repository-url>
cd EMS

# 2. Install all dependencies
npm run install-all

# 3. Setup database with sample data
npm run setup

# 4. Start development servers
npm run dev
```

### Daily Development Commands
```bash
# Start both backend and frontend
npm run dev

# Start only backend (port 3001)
npm run dev:backend

# Start only frontend (port 5173)
npm run dev:frontend

# Build for production
npm run build

# Clean all node_modules
npm run clean

# Reset everything (clean + setup)
npm run reset
```

## 🎯 Team Workflow

### Backend Development
- **Location**: `backend/` folder
- **Port**: 3001
- **Database**: SQLite (`backend/database.sqlite`)
- **API Documentation**: Available at `http://localhost:3001/api-docs`

### Frontend Development
- **Location**: `frontend/` folder
- **Port**: 5173
- **Framework**: React 19 + Vite
- **UI Library**: Radix UI + Tailwind CSS

### Independent Team Work
- **Backend Team**: Works in `backend/` folder independently
- **Frontend Team**: Works in `frontend/` folder independently
- **No conflicts**: Each team has their own package.json and dependencies

## 🔧 Development Setup

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run dev:backend` | Start only backend server |
| `npm run dev:frontend` | Start only frontend server |
| `npm run build` | Build frontend for production |
| `npm run start` | Start production servers |
| `npm run test` | Run backend tests |
| `npm run seed` | Seed database with sample data |
| `npm run seed:kyc` | Seed KYC sample data |
| `npm run setup` | Complete setup (install + seed) |
| `npm run clean` | Remove all node_modules |
| `npm run reset` | Clean + setup everything |

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

## 🗂️ Key Features

### Backend Features
- ✅ Employee Management
- ✅ KYC Management
- ✅ Attendance Tracking
- ✅ Leave Management
- ✅ Payroll System
- ✅ Authentication & Authorization
- ✅ File Upload (KYC Documents)

### Frontend Features
- ✅ Modern React 19 UI
- ✅ Role-based Dashboard
- ✅ Employee Management
- ✅ Attendance Tracking
- ✅ Leave Management
- ✅ KYC Management
- ✅ Payroll System
- ✅ Responsive Design

## 🔒 Authentication

### Default Admin Account
- **Email**: admin@ruralsamridhi.com
- **Password**: admin123

### Default Employee Account
- **Email**: employee@ruralsamridhi.com
- **Password**: employee123

## 📝 Team Guidelines

### Code Organization
- **Backend**: Follow MVC pattern in `backend/src/`
- **Frontend**: Use component-based architecture in `frontend/src/`
- **Shared**: API endpoints documented in `API_Endpoints_Documentation.md`

### Git Workflow
1. Create feature branches
2. Make changes in respective folders
3. Test locally with `npm run dev`
4. Create pull requests
5. Merge after review

### Database Management
- **Development**: SQLite database auto-created
- **Production**: Configure PostgreSQL/MySQL
- **Migrations**: Use Sequelize migrations
- **Seeding**: Use `npm run seed` for sample data

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Kill processes using ports 3001/5173
2. **Dependencies**: Run `npm run clean && npm run install-all`
3. **Database**: Delete `backend/database.sqlite` and run `npm run seed`
4. **Build issues**: Check Node.js version (>=18.0.0)

### Reset Everything
```bash
npm run reset
```

## 📞 Support

- **Documentation**: Check individual README files in backend/ and frontend/
- **API Docs**: http://localhost:3001/api-docs
- **Issues**: Create GitHub issues for bugs/features

---

## 🎉 You're Ready!

Your EMS application is now set up with a clean, independent workflow for your team. Each team member can work independently in their respective folders without conflicts.
