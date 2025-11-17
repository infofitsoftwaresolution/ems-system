#!/bin/bash

# GitHub Setup Script for Rural Samriddhi EMS
# This script helps team members set up the project from GitHub

echo "🚀 Setting up Rural Samriddhi EMS from GitHub..."
echo "================================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Clone repository if not already cloned
if [ ! -d "ems-system" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/infofitsoftwaresolution/ems-system.git
    cd ems-system
else
    echo "📁 Repository already exists, updating..."
    cd ems-system
    git pull origin main
fi

echo "📦 Installing dependencies..."
npm run install-all

echo "🗄️ Setting up database..."
npm run seed
npm run seed:kyc

echo "🎉 Setup complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "👤 Default login credentials:"
echo "   Admin:    admin@ruralsamridhi.com / admin123"
echo "   Employee: employee@ruralsamridhi.com / employee123"
echo ""
echo "🚀 Start development servers:"
echo "   npm run dev"
echo ""
echo "📚 For more information, see:"
echo "   - SETUP_GUIDE.md"
echo "   - TEAM_QUICK_START.md"
echo "   - README.md"
