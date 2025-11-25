# Employees CRUD System Implementation

## Overview
Complete implementation of an Employees database table and CRUD functionality with auto-generated employee IDs, validations, and CSV export capabilities.

## Database Schema

### Table: `employees`

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Auto-increment primary key (shown as "No." in UI) |
| `emp_id` | STRING (UNIQUE) | Employee code (e.g., "RST1001", "RST1002") - auto-generated or manual |
| `name` | STRING (REQUIRED) | Full name of the employee |
| `email` | STRING (UNIQUE, REQUIRED) | Official email ID |
| `mobile_number` | STRING | Mobile/phone number |
| `location` | STRING | Work location or branch |
| `designation` | STRING | Job title |
| `status` | ENUM | "Working" or "Not Working" (default: "Working") |

### Legacy Fields (for backward compatibility)
- `employeeId` - Maps to `emp_id`
- `department` - Maps to `location`
- `position` - Maps to `designation`
- `role`, `hireDate`, `salary`, `kycStatus` - Preserved for existing functionality

## Features Implemented

### 1. Auto-Generated Employee ID
- **Format**: `RST####` (e.g., RST1001, RST1002, RST1003...)
- **Logic**: Finds the highest existing RST#### number and increments by 1
- **Manual Entry**: Users can also provide custom `emp_id` (validated for uniqueness)
- **Starting Point**: If no RST#### employees exist, starts from RST1001

### 2. CRUD Operations

#### Create Employee (`POST /api/employees`)
- Validates required fields (name, email)
- Validates email format
- Auto-generates `emp_id` if not provided
- Validates `emp_id` uniqueness if manually provided
- Creates corresponding User account with temporary password
- Sends welcome email with credentials

#### Read Employees
- **Get All** (`GET /api/employees`): Returns all employees with consistent JSON response
- **Get Single** (`GET /api/employees/:id`): Returns single employee by ID

#### Update Employee (`PUT /api/employees/:id`)
- Validates email format if email is being updated
- Validates email uniqueness if email is being changed
- Validates `emp_id` uniqueness if `emp_id` is being changed
- Updates corresponding User account

#### Delete Employee (`DELETE /api/employees/:id`)
- Comprehensive deletion of all associated records:
  - KYC records and files
  - Attendance records
  - Leave records
  - Payslip records
  - Access logs
  - User account
- Returns deletion summary

### 3. CSV Export

#### Export All Employees (`GET /api/employees/export/csv`)
- Exports all employees to CSV format
- Headers: No, Emp Id, Name of Employee, Mobile Number, Mail Id, Location, Designation, Status
- Accessible by Admin and HR roles

#### Export Single Employee (`GET /api/employees/:id/export/csv`)
- Exports single employee to CSV format
- Filename: `employee_{emp_id}.csv`

### 4. Validations

- **Email Format**: Validates using regex pattern
- **Required Fields**: `name` and `email` are required
- **Unique Constraints**: 
  - `email` must be unique
  - `emp_id` must be unique
- **Status Values**: Only "Working" or "Not Working" allowed

### 5. Consistent JSON Responses

All endpoints return consistent JSON structure:
```json
{
  "success": true/false,
  "message": "Descriptive message",
  "data": { ... },
  "error": "Error code (if applicable)"
}
```

## Files Created/Modified

### Backend Files

1. **`backend/src/models/Employee.js`**
   - Updated model with new fields: `emp_id`, `mobile_number`, `location`, `designation`
   - Updated `status` to ENUM type
   - Maintained backward compatibility with legacy fields

2. **`backend/src/migrations/updateEmployeesTableStructure.js`**
   - Migration to add new columns
   - Migrates existing data from legacy fields to new fields
   - Handles both PostgreSQL and SQLite databases
   - Updates status values from "active"/"inactive" to "Working"/"Not Working"

3. **`backend/src/routes/employees.js`**
   - Complete rewrite with new CRUD operations
   - Auto-generation logic for `emp_id`
   - Comprehensive validations
   - CSV export functionality
   - Consistent error handling and JSON responses

4. **`backend/src/server.js`**
   - Added migration call for employees table structure update

5. **`backend/src/seedEmployees.js`**
   - Seed data with 8 sample employees from the provided list
   - Handles existing employees gracefully

### Frontend Files

1. **`frontend/src/lib/api.js`**
   - Added `exportEmployeesCSV()` method
   - Added `exportEmployeeCSV(id)` method

## API Endpoints

### Employees Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/employees` | Get all employees | Yes |
| GET | `/api/employees/:id` | Get single employee | Yes |
| POST | `/api/employees` | Create new employee | Yes (Admin/HR) |
| PUT | `/api/employees/:id` | Update employee | Yes (Admin/HR) |
| DELETE | `/api/employees/:id` | Delete employee | Yes (Admin/HR) |
| GET | `/api/employees/export/csv` | Export all employees as CSV | Yes (Admin/HR) |
| GET | `/api/employees/:id/export/csv` | Export single employee as CSV | Yes (Admin/HR) |

## Usage Examples

### Create Employee (Auto-generated emp_id)
```javascript
const employeeData = {
  name: "John Doe",
  email: "john.doe@example.com",
  mobile_number: "1234567890",
  location: "Noida",
  designation: "Software Developer",
  status: "Working"
};

const response = await apiService.createEmployee(employeeData);
// emp_id will be auto-generated (e.g., RST1009)
```

### Create Employee (Manual emp_id)
```javascript
const employeeData = {
  emp_id: "CUSTOM001",
  name: "Jane Smith",
  email: "jane.smith@example.com",
  mobile_number: "9876543210",
  location: "Delhi",
  designation: "HR Manager",
  status: "Working"
};

const response = await apiService.createEmployee(employeeData);
// Uses provided emp_id: CUSTOM001
```

### Export All Employees as CSV
```javascript
await apiService.exportEmployeesCSV();
// Downloads employees.csv file
```

### Export Single Employee as CSV
```javascript
await apiService.exportEmployeeCSV(employeeId);
// Downloads employee_{emp_id}.csv file
```

## Seed Data

Run the seed script to populate sample employees:
```bash
cd backend
node src/seedEmployees.js
```

This will create 8 sample employees:
- RST1001 - RST1008 (from the provided employee list)

## Migration

The migration runs automatically on server startup. It will:
1. Add new columns (`emp_id`, `mobile_number`, `location`, `designation`)
2. Update `status` column to ENUM type (PostgreSQL) or STRING (SQLite)
3. Migrate existing data from legacy fields
4. Update status values from old format to new format

## Error Handling

All endpoints return consistent error responses:
- **400 Bad Request**: Validation errors, duplicate entries
- **404 Not Found**: Employee not found
- **500 Internal Server Error**: Server errors

Error response format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## Notes

- The system maintains backward compatibility with existing `employeeId`, `department`, and `position` fields
- Auto-generated `emp_id` follows the pattern: RST#### (starting from RST1001)
- CSV export includes all employee fields in a standardized format
- All validations are performed server-side for security
- User accounts are automatically created/updated when employees are created/updated

