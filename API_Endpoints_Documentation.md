# EMS API Endpoints Documentation

## Base URL

```
http://localhost:3001
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Health Check

### GET /api/health

**Description:** Check server and database health status
**Auth Required:** No
**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "uptime": 1234.567
}
```

---

## 2. Authentication Endpoints

### POST /api/auth/login

**Description:** User login
**Auth Required:** No
**Body:**

```json
{
  "email": "admin@company.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "email": "admin@company.com",
    "name": "Admin User",
    "role": "admin",
    "mustChangePassword": false
  },
  "requirePasswordSetup": false
}
```

### POST /api/auth/update-password

**Description:** Update user password
**Auth Required:** No
**Body:**

```json
{
  "email": "user@company.com",
  "newPassword": "newpassword123"
}
```

### GET /api/auth/users

**Description:** List all users (for debugging)
**Auth Required:** No

### POST /api/auth/create-test-user

**Description:** Create test user with temporary password
**Auth Required:** No
**Body:**

```json
{
  "email": "test@company.com",
  "name": "Test User",
  "role": "employee"
}
```

### POST /api/auth/set-password

**Description:** Set specific password for a user
**Auth Required:** No
**Body:**

```json
{
  "email": "user@company.com",
  "password": "newpassword123"
}
```

### POST /api/auth/create-shubham-user

**Description:** Create specific user account for Shubham Singh
**Auth Required:** No

---

## 3. Employee Management

### GET /api/employees

**Description:** Get all employees
**Auth Required:** No

### GET /api/employees/:id

**Description:** Get employee by ID
**Auth Required:** No

### POST /api/employees

**Description:** Create new employee
**Auth Required:** No
**Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "department": "IT",
  "position": "Software Developer",
  "salary": 50000,
  "hireDate": "2024-01-15",
  "role": "employee"
}
```

### PUT /api/employees/:id

**Description:** Update employee
**Auth Required:** No
**Body:** Same as POST

### DELETE /api/employees/:id

**Description:** Delete employee and all associated records
**Auth Required:** No

---

## 4. User Management

### GET /api/users/:email

**Description:** Get user by email
**Auth Required:** No

### PUT /api/users/:email

**Description:** Update user
**Auth Required:** No
**Body:**

```json
{
  "name": "Updated Name",
  "role": "manager",
  "active": true
}
```

### DELETE /api/users/:email

**Description:** Delete user
**Auth Required:** No

---

## 5. KYC (Know Your Customer)

### POST /api/kyc

**Description:** Submit KYC documents
**Auth Required:** No
**Content-Type:** multipart/form-data
**Body:**

```
employeeId: EMP20240001
fullName: John Doe
dob: 1990-01-01
address: 123 Main St, City, State
documentType: Aadhaar Card
documentNumber: 123456789012
docFront: [file]
docBack: [file]
selfie: [file]
```

### GET /api/kyc

**Description:** Get all KYC requests (admin) or check status by email
**Auth Required:** Yes (for admin list)
**Query Parameters:**

- `email` (optional): Check KYC status for specific email

### GET /api/kyc/:id

**Description:** Get KYC request by ID
**Auth Required:** No

### POST /api/kyc/:id/review

**Description:** Review KYC (approve/reject)
**Auth Required:** Yes
**Body:**

```json
{
  "status": "approved",
  "reviewedBy": "admin",
  "remarks": "Documents verified successfully"
}
```

### GET /api/kyc/file/:filename

**Description:** Get KYC document file
**Auth Required:** No

### DELETE /api/kyc/:id

**Description:** Delete KYC record
**Auth Required:** Yes

---

## 6. Attendance Management

### GET /api/attendance

**Description:** Get all attendance records
**Auth Required:** Yes
**Query Parameters:**

- `filter`: all, today, week, month

### GET /api/attendance/today

**Description:** Get today's attendance for a user
**Auth Required:** Yes
**Query Parameters:**

- `email`: User email

### POST /api/attendance/checkin

**Description:** Employee check-in
**Auth Required:** Yes
**Body:**

```json
{
  "email": "user@company.com",
  "name": "John Doe",
  "latitude": 28.6139,
  "longitude": 77.209,
  "address": "New Delhi, India"
}
```

### POST /api/attendance/checkout

**Description:** Employee check-out
**Auth Required:** Yes
**Body:**

```json
{
  "email": "user@company.com",
  "latitude": 28.6139,
  "longitude": 77.209,
  "address": "New Delhi, India"
}
```

---

## 7. Leave Management

### POST /api/leaves

**Description:** Apply for leave
**Auth Required:** Yes
**Body:**

```json
{
  "email": "user@company.com",
  "name": "John Doe",
  "type": "casual",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "reason": "Personal work",
  "attachmentUrl": ""
}
```

### GET /api/leaves

**Description:** Get all leaves or leaves by email
**Auth Required:** Yes
**Query Parameters:**

- `email` (optional): Filter by user email

### POST /api/leaves/:id/review

**Description:** Review leave application
**Auth Required:** Yes
**Body:**

```json
{
  "status": "approved",
  "reviewedBy": "admin",
  "remarks": "Leave approved"
}
```

---

## 8. Payslip Management

### GET /api/payslip/test

**Description:** Test payslip table
**Auth Required:** No

### GET /api/payslip

**Description:** Get all payslips
**Auth Required:** Yes

### GET /api/payslip/employee/:email

**Description:** Get employee payslips
**Auth Required:** Yes

### POST /api/payslip/generate

**Description:** Generate payslip for employee
**Auth Required:** Yes
**Body:**

```json
{
  "employeeEmail": "user@company.com",
  "month": 1,
  "year": 2024
}
```

### GET /api/payslip/download/:id

**Description:** Download payslip as PDF
**Auth Required:** Yes

---

## 9. Email Services

### POST /api/email/test

**Description:** Send test email
**Auth Required:** No
**Body:**

```json
{
  "to": "test@company.com",
  "emailType": "newEmployee"
}
```

**Email Types:** newEmployee, kycApproved, kycReminder

### GET /api/email/config

**Description:** Check email configuration status
**Auth Required:** No

---

## Common Response Codes

- **200:** Success
- **201:** Created
- **400:** Bad Request
- **401:** Unauthorized
- **403:** Forbidden
- **404:** Not Found
- **500:** Internal Server Error

## File Uploads

For KYC document submission, use `multipart/form-data` content type with file fields:

- `docFront`: Document front image
- `docBack`: Document back image
- `selfie`: Selfie image
- `additionalDocs`: Additional documents (up to 5 files)

## Authentication Flow

1. Login with `/api/auth/login` to get JWT token
2. Include token in Authorization header for protected endpoints
3. Token expires in 2 hours
4. Use `/api/auth/update-password` to change password

## Error Responses

All error responses follow this format:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```
