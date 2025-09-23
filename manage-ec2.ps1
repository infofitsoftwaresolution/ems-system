# EC2 Application Management Script
# This script helps you manage your EMS application on EC2

param(
    [Parameter(Mandatory=$true)]
    [string]$SshKeyPath,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "logs", "restart", "stop", "start", "deploy")]
    [string]$Action,
    
    [string]$Ec2Host = "13.233.73.43",
    [string]$Ec2User = "ec2-user"
)

$ErrorActionPreference = "Stop"

# Check if SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Host "❌ SSH key not found at: $SshKeyPath" -ForegroundColor Red
    exit 1
}

$sshCommand = "ssh -i `"$SshKeyPath`" ${Ec2User}@${Ec2Host}"

switch ($Action) {
    "status" {
        Write-Host "🔍 Checking application status..." -ForegroundColor Yellow
        Invoke-Expression "$sshCommand 'cd /home/ec2-user/app && sudo docker-compose ps'"
        
        Write-Host "`n🏥 Running health checks..." -ForegroundColor Yellow
        Invoke-Expression "$sshCommand 'curl -f http://localhost:3001/api/health && echo `"✅ Backend is healthy`" || echo `"❌ Backend health check failed`"'"
        Invoke-Expression "$sshCommand 'curl -f http://localhost && echo `"✅ Frontend is accessible`" || echo `"❌ Frontend is not accessible`"'"
    }
    
    "logs" {
        Write-Host "📋 Viewing application logs..." -ForegroundColor Yellow
        Invoke-Expression "$sshCommand 'cd /home/ec2-user/app && sudo docker-compose logs -f'"
    }
    
    "restart" {
        Write-Host "🔄 Restarting application..." -ForegroundColor Yellow
        Invoke-Expression "$sshCommand 'cd /home/ec2-user/app && sudo docker-compose restart'"
        Write-Host "✅ Application restarted" -ForegroundColor Green
    }
    
    "stop" {
        Write-Host "⏹️ Stopping application..." -ForegroundColor Yellow
        Invoke-Expression "$sshCommand 'cd /home/ec2-user/app && sudo docker-compose down'"
        Write-Host "✅ Application stopped" -ForegroundColor Green
    }
    
    "start" {
        Write-Host "▶️ Starting application..." -ForegroundColor Yellow
        Invoke-Expression "$sshCommand 'cd /home/ec2-user/app && sudo docker-compose up -d'"
        Write-Host "✅ Application started" -ForegroundColor Green
    }
    
    "deploy" {
        Write-Host "🚀 Starting deployment..." -ForegroundColor Yellow
        & .\deploy-to-ec2.ps1 -SshKeyPath $SshKeyPath -Ec2Host $Ec2Host -Ec2User $Ec2User
    }
}

Write-Host "`n🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$Ec2Host" -ForegroundColor White
Write-Host "   Backend API: http://$Ec2Host`:3001/api" -ForegroundColor White
Write-Host "   Health Check: http://$Ec2Host`:3001/api/health" -ForegroundColor White
