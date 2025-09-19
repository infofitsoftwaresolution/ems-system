# Scripts Directory

This directory contains utility scripts for the Employee Management System.

## Available Scripts

### `test-apis.ps1`
PowerShell script for testing API endpoints.

**Usage:**
```powershell
cd scripts
.\test-apis.ps1
```

**Prerequisites:**
- Backend server must be running on port 3001
- PowerShell execution policy must allow script execution

**What it tests:**
- Authentication endpoints
- Employee management endpoints
- KYC endpoints
- Attendance endpoints
- Leave management endpoints

## Adding New Scripts

When adding new utility scripts to this directory:

1. Use descriptive names
2. Include proper error handling
3. Add documentation in this README
4. Test scripts thoroughly before committing
5. Follow PowerShell best practices for Windows scripts

## Script Categories

- **Testing**: API testing, integration tests
- **Utilities**: Database management, data migration
- **Development**: Setup scripts, environment configuration
- **Maintenance**: Cleanup scripts, backup utilities
