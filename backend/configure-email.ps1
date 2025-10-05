# Email Configuration Script for Rural Samridhi EMS
# This script helps you configure email settings

Write-Host "🔧 Email Configuration Setup" -ForegroundColor Blue
Write-Host "============================" -ForegroundColor Blue
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found. Creating one..." -ForegroundColor Yellow
    
    # Create .env file with email configuration
    $envContent = @"
# Rural Samridhi EMS - Environment Configuration

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3001
NODE_ENV=production

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# ===========================================
# JWT AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-ems-2024-production
JWT_EXPIRES_IN=24h

# ===========================================
# EMAIL CONFIGURATION (Gmail)
# ===========================================
# Your Gmail address
SMTP_USER=your-email@gmail.com

# Gmail App Password (not your regular password)
# To get this:
# 1. Enable 2-Factor Authentication on Gmail
# 2. Go to Google Account → Security → 2-Step Verification → App passwords
# 3. Generate password for "Mail"
SMTP_PASS=your-gmail-app-password

# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# ===========================================
# CORS CONFIGURATION
# ===========================================
FRONTEND_URL=http://localhost:5173

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===========================================
# LOGGING CONFIGURATION
# ===========================================
LOG_LEVEL=info

# ===========================================
# PRODUCTION SETTINGS
# ===========================================
DEBUG=false
ENABLE_REQUEST_LOGGING=false
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "SUCCESS: .env file created" -ForegroundColor Green
}

Write-Host ""
Write-Host "📧 Email Configuration Instructions:" -ForegroundColor Cyan
Write-Host "1. Open your .env file in a text editor" -ForegroundColor White
Write-Host "2. Update the following lines:" -ForegroundColor White
Write-Host "   SMTP_USER=your-actual-email@gmail.com" -ForegroundColor Yellow
Write-Host "   SMTP_PASS=your-gmail-app-password" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. To get Gmail App Password:" -ForegroundColor White
Write-Host "   - Go to Google Account → Security → 2-Step Verification" -ForegroundColor White
Write-Host "   - Click 'App passwords' → Generate password for 'Mail'" -ForegroundColor White
Write-Host "   - Use that password (not your regular Gmail password)" -ForegroundColor White
Write-Host ""
Write-Host "4. Test email configuration:" -ForegroundColor White
Write-Host "   node setup-email.js" -ForegroundColor Yellow
Write-Host ""

# Check current configuration
Write-Host "Current Email Configuration:" -ForegroundColor Cyan
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $smtpUser = ($envContent | Where-Object { $_ -match "^SMTP_USER=" }) -replace "SMTP_USER=", ""
    $smtpPass = ($envContent | Where-Object { $_ -match "^SMTP_PASS=" }) -replace "SMTP_PASS=", ""
    
    Write-Host "SMTP_USER: $smtpUser" -ForegroundColor White
    if ($smtpPass -and $smtpPass -ne "your-gmail-app-password") {
        Write-Host "SMTP_PASS: ***CONFIGURED***" -ForegroundColor Green
    } else {
        Write-Host "SMTP_PASS: NOT CONFIGURED" -ForegroundColor Red
    }
} else {
    Write-Host "No .env file found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
