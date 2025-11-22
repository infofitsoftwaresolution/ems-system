# ⚡ Quick Start Guide

## 🚀 Start Both Servers

### Option 1: Manual (Recommended for debugging)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using npm scripts (if configured)

Check if you have a root `package.json` with start scripts.

## ✅ Verification Checklist

### Backend (Port 3001):
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Migration runs successfully
- [ ] Socket.io initialized
- [ ] Health check works: `curl http://localhost:3001/api/health`

### Frontend (Port 5173):
- [ ] Vite dev server starts
- [ ] No connection errors in console
- [ ] Can access: http://localhost:5173
- [ ] Token verification succeeds (if logged in)

## 🔍 Common Issues & Quick Fixes

### Backend won't start:
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Mac/Linux

# Check database connection
# Verify .env file has correct DATABASE_URL
```

### Frontend shows connection refused:
1. Verify backend is running on port 3001
2. Check `VITE_API_URL` in frontend `.env`
3. Check browser console for specific error

### Messages return 500 error:
1. Check backend logs for database errors
2. Verify migration ran successfully
3. Check if `sender_email`, `sender_name`, `content` columns exist

## 📝 Environment Files

### Backend `.env`:
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/ems_db
JWT_SECRET=your-secret-key
```

### Frontend `.env`:
```env
VITE_API_URL=http://localhost:3001
```

## 🆘 Still Having Issues?

1. Check `STARTUP_GUIDE.md` for detailed troubleshooting
2. Review backend logs for specific errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
