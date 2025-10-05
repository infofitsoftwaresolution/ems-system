#!/bin/bash

# Rural Samridhi EMS - Production Build Script
# This script prepares the application for production deployment

set -e

echo "🏗️  Building Rural Samridhi EMS for Production"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the EMS root directory"
    exit 1
fi

print_status "Cleaning previous builds..."
rm -rf backend/dist frontend/dist backend/node_modules frontend/node_modules

print_status "Installing backend dependencies..."
cd backend
npm ci --only=production
cd ..

print_status "Installing frontend dependencies..."
cd frontend
npm ci --only=production
cd ..

print_status "Building frontend for production..."
cd frontend
npm run build
cd ..

print_status "Creating production directories..."
mkdir -p backend/uploads backend/logs backend/data
mkdir -p ssl

print_status "Setting up production environment..."
if [ ! -f "production.env" ]; then
    print_warning "production.env not found, creating from template..."
    cat > production.env << EOF
# Rural Samridhi EMS - Production Environment Variables
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.rsamriddhi.com
JWT_SECRET=your-super-secret-jwt-key-ems-2024-production-change-this
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
LOG_LEVEL=info
DEBUG=false
ENABLE_REQUEST_LOGGING=true
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SMTP_USER=s24346379@gmail.com
SMTP_PASS=edufxpcbkumsnsyo
BACKUP_ENABLED=true
BACKUP_INTERVAL=24h
BACKUP_RETENTION_DAYS=30
EOF
fi

print_status "Creating production Docker Compose override..."
cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  backend:
    build:
      dockerfile: Dockerfile.production
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/database.sqlite:/app/database.sqlite
      - ./backend/logs:/app/logs

  frontend:
    build:
      dockerfile: Dockerfile.production
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://app.rsamriddhi.com/api
      - VITE_APP_URL=https://app.rsamriddhi.com
EOF

print_status "Creating .dockerignore files..."
cat > backend/.dockerignore << EOF
node_modules
npm-debug.log
.env
.env.local
.env.development
.env.test
.env.production
.git
.gitignore
README.md
Dockerfile
.dockerignore
coverage
.nyc_output
EOF

cat > frontend/.dockerignore << EOF
node_modules
npm-debug.log
.env
.env.local
.env.development
.env.test
.env.production
.git
.gitignore
README.md
Dockerfile
.dockerignore
coverage
.nyc_output
dist
EOF

print_status "Creating production startup script..."
cat > start-production.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Rural Samridhi EMS in Production Mode"
echo "================================================"

# Load environment variables
if [ -f "production.env" ]; then
    export $(cat production.env | grep -v '^#' | xargs)
fi

# Start with Docker Compose
docker-compose -f docker-compose.production.yml -f docker-compose.override.yml up -d

echo "✅ Production services started"
echo "🌐 Frontend: http://app.rsamriddhi.com"
echo "🔧 Backend API: http://app.rsamriddhi.com/api"
EOF

chmod +x start-production.sh

print_status "Creating production stop script..."
cat > stop-production.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Rural Samridhi EMS Production Services"
echo "================================================="

docker-compose -f docker-compose.production.yml -f docker-compose.override.yml down

echo "✅ Production services stopped"
EOF

chmod +x stop-production.sh

print_status "Creating health check script..."
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🏥 Health Check for Rural Samridhi EMS"
echo "======================================"

# Check if services are running
if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "✅ Services are running"
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend is healthy"
    else
        echo "❌ Frontend health check failed"
    fi
else
    echo "❌ Services are not running"
fi
EOF

chmod +x health-check.sh

print_status "Creating backup script..."
cat > backup-production.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📦 Creating production backup..."

# Backup database
if [ -f "backend/database.sqlite" ]; then
    cp backend/database.sqlite $BACKUP_DIR/database_$DATE.sqlite
    echo "✅ Database backed up"
fi

# Backup uploads
if [ -d "backend/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads
    echo "✅ Uploads backed up"
fi

# Backup logs
if [ -d "backend/logs" ]; then
    tar -czf $BACKUP_DIR/logs_$DATE.tar.gz backend/logs
    echo "✅ Logs backed up"
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $DATE"
EOF

chmod +x backup-production.sh

print_status "Creating production README..."
cat > PRODUCTION_README.md << 'EOF'
# Rural Samridhi EMS - Production Deployment

## Quick Start

1. **Start Production Services:**
   ```bash
   ./start-production.sh
   ```

2. **Stop Production Services:**
   ```bash
   ./stop-production.sh
   ```

3. **Health Check:**
   ```bash
   ./health-check.sh
   ```

4. **Backup:**
   ```bash
   ./backup-production.sh
   ```

## Configuration

- **Environment:** `production.env`
- **Domain:** `app.rsamriddhi.com`
- **Frontend:** http://app.rsamriddhi.com
- **Backend API:** http://app.rsamriddhi.com/api

## Admin Credentials

- **Email:** s24346379@gmail.com
- **Password:** rsamriddhi@6287

## Monitoring

- **Logs:** `docker-compose logs -f`
- **Status:** `docker-compose ps`
- **Health:** `./health-check.sh`

## Backup

- **Manual:** `./backup-production.sh`
- **Location:** `./backups/`
- **Retention:** 7 days
EOF

print_status "Build completed successfully!"
echo ""
echo "📁 Production files created:"
echo "   - docker-compose.production.yml"
echo "   - nginx.production.conf"
echo "   - production.env"
echo "   - start-production.sh"
echo "   - stop-production.sh"
echo "   - health-check.sh"
echo "   - backup-production.sh"
echo ""
echo "🚀 To start production:"
echo "   ./start-production.sh"
echo ""
echo "📖 For deployment instructions:"
echo "   See DEPLOYMENT_GUIDE.md"
echo ""
echo "✅ Production build completed!"
