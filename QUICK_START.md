# Quick Start Guide - EMS System

## 🚀 Starting the Application

### Step 1: Start Backend Server

Open a terminal and run:
```bash
cd backend
npm start
```

You should see:
```
Server listening on http://localhost:3001
```

**Keep this terminal window open!**

### Step 2: Start Frontend Server (if not already running)

Open another terminal and run:
```bash
cd frontend
npm run dev
```

You should see:
```
Local:   http://localhost:5173/
```

## 🔐 Login Credentials

### Admin Login:
- **Email:** `s24346379@gmail.com`
- **Password:** `rsamriddhi@6287`
- **Role:** Admin

### Employee Login:
If you need to create an employee account, use the admin panel or run:
```bash
cd backend
npm run seed:kyc
```

## 🛠️ Troubleshooting

### Backend Server Not Starting?

1. **Check if port 3001 is in use:**
   ```bash
   netstat -ano | findstr :3001
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Check for errors in the terminal**

### Can't Login?

1. **Make sure backend server is running** (check http://localhost:3001/api/health)

2. **Reset admin password:**
   ```bash
   cd backend
   npm run seed
   ```

3. **Check database:**
   ```bash
   cd backend
   node ../check-login-credentials.js
   ```

### Connection Refused Error?

- ✅ Backend server must be running on port 3001
- ✅ Frontend server must be running on port 5173
- ✅ Check browser console for specific errors

## 📝 Quick Commands

```bash
# Start backend
cd backend && npm start

# Start frontend  
cd frontend && npm run dev

# Seed database (create admin user)
cd backend && npm run seed

# Check login credentials
node check-login-credentials.js
```

## 🌐 Access URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

