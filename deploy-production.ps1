# Rural Samridhi EMS - Production Deployment Script (PowerShell)
# This script deploys the EMS application to EC2 with proper configuration

param(
    [switch]$Force,
    [switch]$SkipCleanup
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Rural Samridhi EMS Production Deployment..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Status "Docker is available: $dockerVersion"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Status "Docker Compose is available: $composeVersion"
} catch {
    Write-Error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

# Stop any existing containers
Write-Status "Stopping existing containers..."
try {
    docker-compose -f docker-compose.production.yml down --remove-orphans
    Write-Success "Existing containers stopped"
} catch {
    Write-Warning "No existing containers to stop"
}

# Clean up old images (optional)
if (-not $SkipCleanup) {
    Write-Status "Cleaning up old images..."
    try {
        docker system prune -f
        Write-Success "Docker cleanup completed"
    } catch {
        Write-Warning "Docker cleanup failed, continuing..."
    }
}

# Create necessary directories
Write-Status "Creating necessary directories..."
$directories = @("uploads", "data", "logs")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Success "Created directory: $dir"
    } else {
        Write-Status "Directory already exists: $dir"
    }
}

# Create environment file if it doesn't exist
$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Status "Creating environment file..."
    $envContent = @"
# Rural Samridhi EMS - Production Environment Configuration

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
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# ===========================================
# CORS CONFIGURATION
# ===========================================
FRONTEND_URL=http://localhost:80

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
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Success "Environment file created: $envFile"
} else {
    Write-Status "Environment file already exists: $envFile"
}

# Build and start services
Write-Status "Building and starting services..."
try {
    docker-compose -f docker-compose.production.yml up --build -d
    Write-Success "Services started successfully"
} catch {
    Write-Error "Failed to start services: $_"
    exit 1
}

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 30

# Check if services are running
Write-Status "Checking service health..."

# Check backend health
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 10 -UseBasicParsing
    if ($backendResponse.StatusCode -eq 200) {
        Write-Success "Backend service is healthy"
    } else {
        Write-Warning "Backend service returned status: $($backendResponse.StatusCode)"
    }
} catch {
    Write-Warning "Backend service may not be ready yet: $_"
}

# Check frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:80" -TimeoutSec 10 -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend service is healthy"
    } else {
        Write-Warning "Frontend service returned status: $($frontendResponse.StatusCode)"
    }
} catch {
    Write-Warning "Frontend service may not be ready yet: $_"
}

# Show running containers
Write-Status "Running containers:"
docker-compose -f docker-compose.production.yml ps

# Show logs
Write-Status "Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=20

Write-Success "🎉 Deployment completed successfully!"
Write-Status "Your EMS application should be available at:"
Write-Status "  Frontend: http://localhost:80"
Write-Status "  Backend API: http://localhost:3001/api"
Write-Status ""
Write-Status "To view logs: docker-compose -f docker-compose.production.yml logs -f"
Write-Status "To stop services: docker-compose -f docker-compose.production.yml down"
Write-Status "To restart services: docker-compose -f docker-compose.production.yml restart"
