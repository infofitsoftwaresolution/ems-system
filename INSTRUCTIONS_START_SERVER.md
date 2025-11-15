# 🚨 IMPORTANT: Backend Server Not Running

## The Error You're Seeing:
```
ERR_CONNECTION_REFUSED
Failed to fetch
```

This means **the backend server is not running**.

## ✅ Quick Fix:

### Step 1: Start the Backend Server

**Option A: Double-click the file**
- Double-click `START_BACKEND.bat` in the project root folder
- A new window will open showing the server starting
- Wait until you see: `Server listening on http://localhost:3001`
- **Keep this window open!**

**Option B: Manual start**
1. Open a new terminal/command prompt
2. Run:
   ```bash
   cd backend
   npm start
   ```
3. Wait for: `Server listening on http://localhost:3001`
4. **Keep this terminal open!**

### Step 2: Verify Server is Running

Open this URL in your browser:
```
http://localhost:3001/api/health
```

If you see a response, the server is running! ✅

### Step 3: Try Logging In Again

Go to: http://localhost:5173

**Login Credentials:**
- Email: `s24346379@gmail.com`
- Password: `rsamriddhi@6287`

## 🔍 Troubleshooting

### If server doesn't start:
1. Check for errors in the terminal
2. Make sure Node.js is installed: `node --version`
3. Install dependencies: `cd backend && npm install`

### If you see "port already in use":
- Another process is using port 3001
- Stop it or change the port in `backend/src/server.js`

### If login still fails after server starts:
1. Make sure backend is running (check terminal)
2. Run: `node check-login-credentials.js` to fix credentials
3. Check browser console (F12) for specific errors

## 📝 Remember:
- **Backend server MUST be running** for login to work
- Keep the backend terminal window open while using the app
- Frontend runs on port 5173
- Backend runs on port 3001

