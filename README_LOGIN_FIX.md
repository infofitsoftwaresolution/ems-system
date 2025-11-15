# Fix: Unable to Login - Database Locked Error

## Problem
You're seeing `SQLITE_BUSY: database is locked` error when trying to run `npm run seed`.

## Solution

### Option 1: Quick Fix (Recommended)
1. **Stop the backend server** if it's running (press `Ctrl+C` in the terminal where it's running)
2. **Wait 2-3 seconds** for the database to unlock
3. **Run the seed script:**
   ```bash
   cd backend
   npm run seed
   ```
4. **Start the backend server again:**
   ```bash
   npm start
   ```

### Option 2: Use the Fix Script
Double-click `fix-database-lock.bat` in the project root. This will:
- Stop all Node processes
- Wait for database to unlock
- Run the seed script
- Start the backend server

### Option 3: Manual Steps
1. **Find and stop Node processes:**
   ```bash
   taskkill /F /IM node.exe
   ```
2. **Wait 3 seconds**
3. **Run seed:**
   ```bash
   cd backend
   npm run seed
   ```
4. **Start server:**
   ```bash
   npm start
   ```

## Login Credentials

After running the seed script, use these credentials:

### Admin:
- **Email:** `s24346379@gmail.com`
- **Password:** `rsamriddhi@6287`

## Verify It's Working

1. **Check backend is running:**
   - Open: http://localhost:3001/api/health
   - Should see a response

2. **Try logging in:**
   - Go to: http://localhost:5173
   - Use admin credentials above

## Why This Happens

SQLite locks the database file when:
- The backend server is running
- Another process is accessing the database
- A previous process didn't close properly

The fix script stops all Node processes, waits for the lock to clear, then runs the seed.

