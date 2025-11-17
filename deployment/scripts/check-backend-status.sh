#!/bin/bash

# Diagnostic script to check backend status on EC2
# Run this on the EC2 instance to diagnose 502 errors

echo "=========================================="
echo "Backend Status Diagnostic Script"
echo "=========================================="
echo ""

# Check if Docker is running
echo "1. Checking Docker status..."
if systemctl is-active --quiet docker; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is NOT running"
    echo "   Run: sudo systemctl start docker"
fi
echo ""

# Check container status
echo "2. Checking container status..."
cd /home/ec2-user/app 2>/dev/null || cd /opt/ems-deployment 2>/dev/null || echo "⚠️  Could not find app directory"

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.production.yml" ]; then
    echo "📋 Container status:"
    docker-compose ps 2>/dev/null || docker-compose -f docker-compose.production.yml ps 2>/dev/null
    echo ""
    
    # Check if backend container exists
    if docker ps -a | grep -q "ems-backend\|backend"; then
        echo "✅ Backend container exists"
        
        # Check if it's running
        if docker ps | grep -q "ems-backend\|backend"; then
            echo "✅ Backend container is RUNNING"
        else
            echo "❌ Backend container is NOT running"
            echo ""
            echo "📋 Last 50 lines of backend logs:"
            docker-compose logs --tail=50 backend 2>/dev/null || docker-compose -f docker-compose.production.yml logs --tail=50 backend 2>/dev/null
        fi
    else
        echo "❌ Backend container does NOT exist"
    fi
else
    echo "⚠️  docker-compose.yml not found in current directory"
fi
echo ""

# Check backend logs
echo "3. Backend container logs (last 100 lines):"
echo "----------------------------------------"
docker-compose logs --tail=100 backend 2>/dev/null || docker-compose -f docker-compose.production.yml logs --tail=100 backend 2>/dev/null || echo "Could not retrieve logs"
echo ""

# Check if backend port is accessible
echo "4. Testing backend connectivity..."
if docker ps | grep -q "ems-backend\|backend"; then
    echo "Testing from inside backend container:"
    docker exec ems-backend curl -f http://localhost:3001/api/health 2>/dev/null && echo "✅ Backend health check passed" || echo "❌ Backend health check failed"
    echo ""
    
    echo "Testing from host:"
    curl -f http://localhost:3001/api/health 2>/dev/null && echo "✅ Backend accessible on localhost:3001" || echo "❌ Backend NOT accessible on localhost:3001"
else
    echo "⚠️  Backend container is not running, skipping connectivity test"
fi
echo ""

# Check environment variables
echo "5. Checking environment variables..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "Environment variables (masking sensitive data):"
    grep -E "^(POSTGRES_|DB_|JWT_|NODE_ENV)" .env | sed 's/\(PASSWORD\|SECRET\|PASS\)=.*/\1=***MASKED***/' || echo "No relevant env vars found"
else
    echo "❌ .env file NOT found"
    echo "   This might be the issue - backend needs environment variables"
fi
echo ""

# Check network connectivity
echo "6. Checking Docker network..."
docker network ls | grep -E "ems-network|app-network" && echo "✅ Docker network exists" || echo "⚠️  Docker network might be missing"
echo ""

# Check nginx connectivity to backend
echo "7. Testing nginx -> backend connectivity..."
if docker ps | grep -q "nginx"; then
    echo "Testing from nginx container:"
    docker exec ems-nginx curl -f http://backend:3001/api/health 2>/dev/null && echo "✅ Nginx can reach backend" || echo "❌ Nginx CANNOT reach backend"
else
    echo "⚠️  Nginx container not found"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
if docker ps | grep -q "ems-backend\|backend"; then
    echo "✅ Backend container is running"
    echo ""
    echo "If you're still getting 502 errors:"
    echo "1. Check backend logs above for errors"
    echo "2. Verify database connection (check POSTGRES_* env vars)"
    echo "3. Restart backend: docker-compose restart backend"
else
    echo "❌ Backend container is NOT running"
    echo ""
    echo "To fix:"
    echo "1. Check logs above for startup errors"
    echo "2. Verify .env file has correct RDS credentials"
    echo "3. Start containers: docker-compose up -d"
fi
echo ""

