# Email Setup Guide for Employee Management System

## Current Issue
The system is unable to send emails to new employees because SMTP credentials are not configured.

## Solution Steps

### Step 1: Configure Gmail Account

#### Option A: Use Gmail with App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Scroll down to "App passwords"
   - Select "Mail" and generate password
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update .env file** in `backend/.env`:
   ```env
   # Email Configuration
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   JWT_SECRET=dev-secret-key
   ```

#### Option B: Use Other Email Providers

For Outlook/Hotmail:
```env
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

For Yahoo:
```env
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Step 2: Update Email Service Configuration

If you want to use a different SMTP provider, update `backend/src/services/emailService.js`:

```javascript
const transporter = nodemailer.createTransporter({
  host: "smtp.gmail.com",        // Change for other providers
  port: 465,                     // Change for other providers
  secure: true,                  // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

### Step 3: Restart Backend Server

After updating the `.env` file:
```bash
cd backend
npm start
```

### Step 4: Test Email Configuration

Test if email is working:
```bash
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-test-email@gmail.com", "emailType": "newEmployee"}'
```

### Step 5: Create Test Employee

Create a new employee to test the full flow:
```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Employee",
    "email": "test-employee@gmail.com",
    "phone": "+1234567890",
    "department": "IT",
    "position": "Developer",
    "salary": 50000,
    "hireDate": "2024-01-15",
    "role": "employee"
  }'
```

## Email Templates Available

1. **New Employee Welcome** - Sent when creating employee
2. **KYC Approved** - Sent when KYC is approved
3. **KYC Reminder** - Sent as reminder to complete KYC

## Troubleshooting

### Common Issues:

1. **"Invalid login" error**:
   - Make sure you're using App Password, not regular password
   - Ensure 2FA is enabled on Gmail

2. **"Connection timeout"**:
   - Check internet connection
   - Verify SMTP settings

3. **"Authentication failed"**:
   - Double-check email and password in .env file
   - Ensure no extra spaces in credentials

### Check Email Configuration Status:
```bash
curl -X GET http://localhost:3001/api/email/config
```

Should return:
```json
{
  "emailUser": "your-email@gmail.com",
  "emailPassword": "Configured",
  "isConfigured": true
}
```

## What Happens When Employee is Created

1. Employee record created in database
2. User account created with temporary password
3. Welcome email sent automatically with:
   - Temporary Employee ID
   - Temporary Password
   - Login URL
   - Instructions for next steps

## Email Content Preview

The welcome email includes:
- Professional HTML design
- Company branding
- Temporary credentials
- Step-by-step instructions
- KYC completion guidance
- Login URL

## Next Steps After Email Setup

1. Test email configuration
2. Create a test employee
3. Verify email is received
4. Test the complete employee onboarding flow
