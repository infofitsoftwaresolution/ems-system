@echo off
echo Resolving merge conflicts...

REM Mark all conflicted files as resolved
git add backend/src/routes/messages.js
git add backend/src/server.js
git add frontend/src/hooks/use-socket.js
git add frontend/src/page/Communication.jsx

echo.
echo Files marked as resolved.
echo.
echo Current status:
git status --short

echo.
echo If all conflicts are resolved, you can now commit:
echo   git commit -m "Merge: Resolve conflicts in chat/notifications features"
echo.
echo Or continue the merge/rebase:
echo   git merge --continue
echo   (or: git rebase --continue)
echo.

pause

