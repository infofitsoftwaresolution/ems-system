# EMS Deployment Script
Write-Host " Starting EMS Deployment to EC2..." -ForegroundColor Green

# Configuration
$EC2_IP = "13.233.73.43"
$EC2_USER = "ec2-user"
$KEY_FILE = "r-samridhi.pem"
$REGION = "ap-south-1"

# Check if key file exists in common locations
$keyPaths = @(
    ".\",
    "..\..\",
    "C:\Users\shubh\.ssh\",
    "C:\Users\shubh\Downloads\"
)

$keyFile = $null
foreach ($path in $keyPaths) {
    if (Test-Path $path) {
        $keyFile = $path
        break
    }
}

if (-not $keyFile) {
    Write-Host " SSH key file not found. Please ensure r-samridhi.pem is in one of these locations:" -ForegroundColor Red
    foreach ($path in $keyPaths) {
        Write-Host "  - $path" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host " Found SSH key: $keyFile" -ForegroundColor Green

# Check if Docker images exist
if (-not (Test-Path "backend-image.tar") -or -not (Test-Path "frontend-image.tar")) {
    Write-Host " Docker images not found. Building images..." -ForegroundColor Red
    docker-compose build
    docker save docker-backend:latest -o backend-image.tar
    docker save docker-frontend:latest -o frontend-image.tar
}

Write-Host " Transferring Docker images to EC2..." -ForegroundColor Yellow
scp -i "$keyFile" -o StrictHostKeyChecking=no backend-image.tar frontend-image.tar ${EC2_USER}@${EC2_IP}:/home/${EC2_USER}/

Write-Host " Deploying containers on EC2..." -ForegroundColor Yellow
ssh -i "$keyFile" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} @"
# Load Docker images
docker load -i backend-image.tar
docker load -i frontend-image.tar

# Stop and remove existing containers
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Run backend container
docker run -d --name ems-backend -p 3001:3001 \
  -e NODE_ENV=production \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_NAME=employee_management \
  -e DB_USER=postgres \
  -e DB_PASSWORD=root \
  -e JWT_SECRET=your-super-secret-jwt-key \
  docker-backend:latest

# Run frontend container
docker run -d --name ems-frontend -p 80:80 \
  -e BACKEND_URL=http://13.233.73.43:3001 \
  docker-frontend:latest

# Check container status
echo "Container Status:"
docker ps

echo "Deployment completed!"
