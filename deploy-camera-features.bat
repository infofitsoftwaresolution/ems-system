@echo off
echo ========================================
echo Deploying Camera Features and Fixes
echo ========================================
echo.

echo [1/5] Checking git status...
git status
echo.

echo [2/5] Creating new branch...
git checkout -b feature/camera-attendance-system
if %errorlevel% neq 0 (
    echo Branch might already exist, switching to it...
    git checkout feature/camera-attendance-system
)
echo.

echo [3/5] Adding all changes...
git add .
echo.

echo [4/5] Committing changes...
git commit -m "feat: Implement production-ready camera-based attendance system

- Add reusable useCamera hook with comprehensive error handling
- Implement automatic camera opening on check-in/check-out
- Add photo capture with thumbnail previews
- Fix camera video display issues with reactive stream attachment
- Add ErrorBoundary for graceful error handling
- Suppress Chrome extension warnings in production
- Fix handleCapturePhoto undefined error
- Fix favicon 404 error
- Add comprehensive error handling for all edge cases
- Implement production-ready error suppression
- Add visual feedback for camera states
- Enhance stream attachment with useEffect
- Add detailed logging for debugging

Features:
- Automatic camera opening on attendance actions
- Photo capture with base64 encoding
- Thumbnail previews in attendance card
- Comprehensive error handling
- Production-ready error suppression
- User-friendly error messages

Fixes:
- Camera video not displaying (timing issues)
- handleCapturePhoto undefined error
- Chrome extension warnings
- Favicon 404 error
- React error boundaries

Files:
- frontend/src/hooks/use-camera.js (new)
- frontend/src/page/EmployeeAttendance.jsx (updated)
- frontend/src/components/ErrorBoundary.jsx (new)
- frontend/src/main.jsx (updated)
- frontend/src/App.jsx (updated)
- frontend/index.html (updated)
- ATTENDANCE_CAMERA_IMPLEMENTATION.md (new)
- ERROR_FIXES_SUMMARY.md (new)
- CAMERA_VIDEO_FIX.md (new)"
echo.

echo [5/5] Pushing to remote...
git push -u origin feature/camera-attendance-system
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Branch: feature/camera-attendance-system
echo Next steps:
echo 1. Create a Pull Request on GitHub
echo 2. Review and merge to main
echo 3. Deployment will trigger automatically (if CI/CD is configured)
echo.
pause

