@echo off
echo Creating database backup...
echo.

REM Create backup directory if it doesn't exist
if not exist "backups" mkdir backups

REM Create timestamp for backup filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

REM Copy database file to backup
if exist "backend\database.sqlite" (
    copy "backend\database.sqlite" "backups\database_backup_%timestamp%.sqlite" >nul
    echo Database backed up to: backups\database_backup_%timestamp%.sqlite
) else (
    echo No database file found to backup.
)

echo.
echo Backup completed!
pause


