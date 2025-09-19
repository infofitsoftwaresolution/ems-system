# API Testing Script for Employee Management System
Write-Host "=== API Testing Script ===" -ForegroundColor Green
Write-Host ""

# Test Health Endpoint
Write-Host "1. Testing Health API..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -UseBasicParsing
    Write-Host "✅ Health API: Status $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health API: Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test Login API
Write-Host "2. Testing Login API..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@company.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing
    Write-Host "✅ Login API: Status $($loginResponse.StatusCode)" -ForegroundColor Green
    
    # Extract token for further tests
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "   Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login API: Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test Employees API (without auth)
Write-Host "3. Testing Employees API (no auth)..." -ForegroundColor Yellow
try {
    $employeesResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/employees" -Method GET -UseBasicParsing
    Write-Host "✅ Employees API: Status $($employeesResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Employees API: Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test Employees API (with auth)
if ($token) {
    Write-Host "4. Testing Employees API (with auth)..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $employeesAuthResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/employees" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "✅ Employees API (Auth): Status $($employeesAuthResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Employees API (Auth): Failed - $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test KYC API
Write-Host "5. Testing KYC API..." -ForegroundColor Yellow
try {
    $kycResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/kyc" -Method GET -UseBasicParsing
    Write-Host "✅ KYC API: Status $($kycResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ KYC API: Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test Attendance API
Write-Host "6. Testing Attendance API..." -ForegroundColor Yellow
try {
    $attendanceResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/attendance" -Method GET -UseBasicParsing
    Write-Host "✅ Attendance API: Status $($attendanceResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Attendance API: Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test Leaves API
Write-Host "7. Testing Leaves API..." -ForegroundColor Yellow
try {
    $leavesResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/leaves" -Method GET -UseBasicParsing
    Write-Host "✅ Leaves API: Status $($leavesResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Leaves API: Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test Payslip API
Write-Host "8. Testing Payslip API..." -ForegroundColor Yellow
try {
    $payslipResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/payslip" -Method GET -UseBasicParsing
    Write-Host "✅ Payslip API: Status $($payslipResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Payslip API: Failed - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== API Testing Complete ===" -ForegroundColor Green







