# Rural Samriddhi EMS - Local Development Startup Script
# This script starts the application without Docker for local development

Write-Host "🚀 Starting Rural Samriddhi EMS (Local Development)..." -ForegroundColor Blue

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Create environment file if it doesn't exist
$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating environment file..." -ForegroundColor Yellow
    $envContent = @"
# Rural Samriddhi EMS - Local Development Environment

PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-ems-2024-local
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
LOG_LEVEL=info
DEBUG=true
ENABLE_REQUEST_LOGGING=true
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "Environment file created: $envFile" -ForegroundColor Green
}

# Create necessary directories
$directories = @("backend\uploads", "backend\data", "backend\logs")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Blue
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Run database seed to create admin user
Write-Host "Setting up database and creating admin user..." -ForegroundColor Blue
node src/seed.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to seed database" -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Blue
Start-Process -FilePath "node" -ArgumentList "src/server.js" -WindowStyle Minimized

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Go back to root directory
Set-Location ..

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Start frontend development server
Write-Host "Starting frontend development server..." -ForegroundColor Blue
Write-Host "Backend will be available at: http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Green
Write-Host "Admin credentials:" -ForegroundColor Yellow
Write-Host "  Email: s24346379@gmail.com" -ForegroundColor Yellow
Write-Host "  Password: rsamriddhi@6287" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Cyan

npm run dev


