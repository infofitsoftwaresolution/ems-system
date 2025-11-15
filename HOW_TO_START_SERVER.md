# 🚨 CRITICAL: Backend Server Must Be Running!

## The Error You're Seeing:
```
ERR_CONNECTION_REFUSED
Failed to fetch
Backend server is not running
```

## ✅ SOLUTION: Start the Backend Server

### Method 1: Use the Startup Script (EASIEST)

**Double-click this file:**
```
START_BACKEND.bat
```

This will open a new window and start the server. You should see:
```
Server listening on http://localhost:3001
```

**Keep this window open!** If you close it, the server stops.

---

### Method 2: Manual Start

1. **Open a NEW terminal/command prompt**

2. **Navigate to backend folder:**
   ```bash
   cd d:\19.infofit_Soft\EMS_EMS\ems-system\backend
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Wait for this message:**
   ```
   Server listening on http://localhost:3001
   ```

5. **Keep this terminal window open!**

---

## ✅ Verify Server is Running

Open this URL in your browser:
```
http://localhost:3001/api/health
```

If you see a response (even an error page), the server is running! ✅

---

## 🔐 Login Credentials

After the server is running, use these credentials:

- **Email:** `s24346379@gmail.com`
- **Password:** `rsamriddhi@6287`

---

## ⚠️ Important Notes

1. **Backend server MUST be running** for login to work
2. **Keep the backend terminal window open** while using the app
3. If you close the terminal, the server stops and login will fail
4. Frontend runs on port 5173 (usually already running)
5. Backend runs on port 3001 (you need to start this)

---

## 🔧 Troubleshooting

### Server won't start?
- Check for errors in the terminal
- Make sure Node.js is installed: `node --version`
- Install dependencies: `cd backend && npm install`

### Port 3001 already in use?
- Another process is using the port
- Stop other Node processes: `taskkill /F /IM node.exe`
- Or change the port in `backend/src/server.js`

### Still can't login after server starts?
1. Verify server is running (check http://localhost:3001/api/health)
2. Run: `node check-login-credentials.js` to fix credentials
3. Check browser console (F12) for specific errors

---

## 📝 Quick Checklist

- [ ] Backend server is running (check terminal for "Server listening...")
- [ ] Can access http://localhost:3001/api/health
- [ ] Using correct credentials (s24346379@gmail.com / rsamriddhi@6287)
- [ ] Backend terminal window is still open

---

**Once the backend server is running, try logging in again!**

