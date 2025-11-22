# 🚀 Startup Guide - EMS System

This guide will help you start both the frontend and backend servers correctly.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** (v8 or higher)
3. **PostgreSQL** (if using PostgreSQL) or **SQLite** (default)

## Step 1: Start the Backend Server

### Navigate to backend directory:
```bash
cd backend
```

### Install dependencies (if not already installed):
```bash
npm install
```

### Check environment variables:
Create or verify `.env` file in the `backend` directory:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ems_db
# OR for SQLite (default):
# DATABASE_URL=sqlite://./database.sqlite
JWT_SECRET=your-secret-key-here
```

### Start the backend server:
```bash
# Development mode (with auto-reload):
npm run dev

# OR Production mode:
npm start
```

### ✅ Verify Backend is Running:

You should see output like:
```
✅ Database connection established successfully
🔄 Running messages table migration for postgres...
✅ Messages table structure fixed
Database sync successful
Server listening on http://localhost:3001
Socket.io listening on port 3001
```

### Test Backend Health:
Open in browser or use curl:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

## Step 2: Start the Frontend Server

### Open a NEW terminal window/tab

### Navigate to frontend directory:
```bash
cd frontend
```

### Install dependencies (if not already installed):
```bash
npm install
```

### Check environment variables:
Create or verify `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3001
```

### Start the frontend server:
```bash
npm run dev
```

### ✅ Verify Frontend is Running:

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 3: Verify Connection

1. **Open browser**: http://localhost:5173
2. **Check browser console** (F12):
   - Should see: `Token verification successful` (if logged in)
   - Should NOT see: `ERR_CONNECTION_REFUSED` errors
3. **Check backend logs**:
   - Should see: `✅ Socket.io client connected` when frontend loads

## Troubleshooting

### ❌ Error: `ERR_CONNECTION_REFUSED`

**Problem**: Backend server is not running or not accessible.

**Solutions**:
1. Verify backend is running on port 3001:
   ```bash
   # Check if port 3001 is in use:
   # Windows:
   netstat -ano | findstr :3001
   # Linux/Mac:
   lsof -i :3001
   ```

2. Check backend logs for errors:
   - Look for database connection errors
   - Look for migration errors
   - Look for port conflicts

3. Try starting backend manually:
   ```bash
   cd backend
   node src/server.js
   ```

### ❌ Error: `POST /api/messages returns 500`

**Problem**: Database schema issue or missing columns.

**Solutions**:
1. Check backend logs for specific error:
   - Look for `column "sender_email" does not exist`
   - Look for migration errors

2. Run migration manually:
   ```bash
   cd backend
   node -e "import('./src/migrations/fixMessagesTable.js').then(m => m.fixMessagesTable())"
   ```

3. Verify database connection:
   - Check `.env` file has correct `DATABASE_URL`
   - Test connection: `psql $DATABASE_URL` (for PostgreSQL)

### ❌ Error: Token verification fails repeatedly

**Problem**: Backend not responding or auth route issue.

**Solutions**:
1. Check backend `/api/auth/verify` endpoint:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/auth/verify
   ```

2. Verify JWT_SECRET in backend `.env` matches

3. Check backend logs for auth errors

### ❌ Socket.io connection fails

**Problem**: Socket.io server not initialized or CORS issue.

**Solutions**:
1. Verify Socket.io is initialized in `backend/src/server.js`
2. Check CORS settings include `http://localhost:5173`
3. Check backend logs for Socket.io connection messages

## Quick Start Commands

### Terminal 1 (Backend):
```bash
cd backend
npm install
npm start
```

### Terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
```

## Port Configuration

- **Backend**: `http://localhost:3001` (configurable via `PORT` env var)
- **Frontend**: `http://localhost:5173` (Vite default)
- **Socket.io**: Same port as backend (3001)

## Environment Variables

### Backend (.env):
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ems_db
JWT_SECRET=your-secret-key-change-in-production
```

### Frontend (.env):
```env
VITE_API_URL=http://localhost:3001
```

## Next Steps

1. ✅ Backend running on port 3001
2. ✅ Frontend running on port 5173
3. ✅ No connection errors in browser console
4. ✅ Can login and access features
5. ✅ Messages/chat functionality works

If all steps complete successfully, your application is ready to use!

