@echo off
echo ========================================
echo Git Commit, Push, and Deploy Script
echo ========================================
echo.

REM Step 1: Check current status
echo [1/6] Checking git status...
git status --short
echo.

REM Step 2: Fetch latest changes
echo [2/6] Fetching latest changes from remote...
git fetch origin
echo.

REM Step 3: Mark conflicted files as resolved (if any)
echo [3/6] Marking conflicted files as resolved...
git add backend/src/routes/messages.js 2>nul
git add backend/src/server.js 2>nul
git add frontend/src/hooks/use-socket.js 2>nul
git add frontend/src/page/Communication.jsx 2>nul
git add frontend/src/page/Notifications.jsx 2>nul
git add frontend/src/App.jsx 2>nul
echo.

REM Step 4: Add all changes
echo [4/6] Adding all changes...
git add .
echo.

REM Step 5: Pull with merge strategy
echo [5/6] Pulling latest changes (this may create merge conflicts)...
git pull origin main --no-edit
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Merge conflicts detected or pull failed!
    echo Please resolve conflicts manually, then run:
    echo   git add .
    echo   git commit -m "Merge: Resolve conflicts"
    echo   git push origin main
    echo.
    pause
    exit /b 1
)
echo.

REM Step 6: Commit if there are uncommitted changes
echo [6/6] Committing changes...
git status --short | findstr /C:"??" /C:" M" /C:"A " /C:"D " >nul
if %errorlevel% equ 0 (
    git commit -m "feat: Add real-time chat, notifications, and Socket.IO integration

- Implement real-time communication system with direct messages and channels
- Add notifications page with real-time updates
- Fix Socket.IO connection issues (CORS, server setup, client configuration)
- Add URL query parameter support for opening conversations from links
- Create notifications system with backend model, routes, and frontend UI
- Add /communication route alongside /messages
- Implement notification creation for messages (direct and channel)
- Fix duplicate message sending issue
- Add employee-specific attendance endpoint
- Optimize KYC status loading in Employee Dashboard
- Add comprehensive error handling and logging
- Resolve merge conflicts"
    echo Commit created successfully!
) else (
    echo No changes to commit.
)
echo.

REM Step 7: Push to remote
echo [7/7] Pushing to remote repository...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Push failed!
    echo You may need to pull and merge again, or use:
    echo   git push --force origin main  (WARNING: Only if you're sure!)
    echo.
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Changes pushed to GitHub
echo ========================================
echo.
echo DEPLOYMENT STATUS:
echo - Automatic deployment will trigger on push to main branch
echo - Workflow: "Deploy to EC2 with RDS"
echo - Check deployment progress at:
echo   https://github.com/infofitsoftwaresolution/ems-system/actions
echo.
echo To manually trigger deployment:
echo 1. Go to: https://github.com/infofitsoftwaresolution/ems-system/actions
echo 2. Select "Deploy to EC2 with RDS" workflow
echo 3. Click "Run workflow" button
echo.
pause

