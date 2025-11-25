@echo off
echo ========================================
echo Deploying Employees Module to Production
echo ========================================
echo.

echo [1/6] Checking git status...
git status --short
echo.

echo [2/6] Creating new branch...
set BRANCH_NAME=feature/employees-module-soft-delete
git checkout -b %BRANCH_NAME%
if %errorlevel% neq 0 (
    echo Branch might already exist, switching to it...
    git checkout %BRANCH_NAME%
)
echo.

echo [3/6] Adding all changes...
git add .
echo.

echo [4/6] Committing changes...
git commit -m "feat: Complete Employees module with soft delete and role-based access

Features:
- Auto-generated emp_id (RST1001, RST1002...)
- Manual emp_id entry support
- Soft delete functionality (HR role)
- Hard delete functionality (Admin role)
- Role-based access control (Admin/HR only)
- Soft-deleted employees visible with 'Not Working' status
- Enhanced UI with red badge for soft-deleted employees
- All CRUD operations with validations
- CSV export functionality
- Sample seed data included

Database:
- Added is_active field for soft delete
- Migration auto-runs on server startup
- Backward compatible with existing data

API Endpoints:
- GET /api/employees - List all employees (including soft-deleted)
- GET /api/employees/:id - Get single employee
- POST /api/employees - Create employee (auto-generate emp_id)
- PUT /api/employees/:id - Update employee
- DELETE /api/employees/:id - Soft delete (HR) or Hard delete (Admin)
- GET /api/employees/export/csv - Export all as CSV
- GET /api/employees/:id/export/csv - Export single as CSV

Frontend:
- Enhanced employee table with all required columns
- Role-based delete options (Admin: Permanent, HR: Soft)
- Improved status badge UI
- Soft-deleted employees displayed with red 'Not Working' badge
- Filtering and sorting functionality

Files Modified:
- backend/src/models/Employee.js
- backend/src/routes/employees.js
- backend/src/migrations/updateEmployeesTableStructure.js
- backend/src/seedEmployees.js
- backend/src/server.js
- frontend/src/page/Employees.jsx
- frontend/src/lib/api.js
- frontend/src/page/Dashboard.jsx
- frontend/src/page/Employees.jsx
- frontend/src/page/Tasks.jsx
- frontend/src/page/Communication.jsx
- frontend/src/page/EmployeePayslip.jsx
- frontend/src/page/PayslipManagement.jsx"
echo.

echo [5/6] Pushing to remote...
git push -u origin %BRANCH_NAME%
echo.

echo [6/6] Merging to main and deploying...
git checkout main
git merge %BRANCH_NAME%
git push origin main
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Branch: %BRANCH_NAME%
echo Status: Merged to main and pushed
echo.
echo Next steps:
echo 1. Create Pull Request on GitHub (if needed)
echo 2. CI/CD pipeline should trigger automatically
echo 3. Verify deployment in production environment
echo.
pause

