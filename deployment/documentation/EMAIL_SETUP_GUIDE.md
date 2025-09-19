# Email Configuration Guide

## Issue: Employees not receiving emails when added

The email functionality is not working because SMTP credentials are not configured.

## Solutions:

### Option 1: Gmail SMTP (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Set Environment Variables**:
   ```bash
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Option 2: Mailtrap (For Development/Testing)
1. **Sign up** at https://mailtrap.io
2. **Get credentials** from your inbox
3. **Set Environment Variables**:
   ```bash
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   SMTP_SECURE=false
   ```

### Option 3: Other SMTP Providers
- **Outlook/Hotmail**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587
- **Custom SMTP**: Configure with your provider's settings

## How to Set Environment Variables:

### Windows (PowerShell):
```powershell
$env:SMTP_USER="your-email@gmail.com"
$env:SMTP_PASS="your-app-password"
```

### Windows (Command Prompt):
```cmd
set SMTP_USER=your-email@gmail.com
set SMTP_PASS=your-app-password
```

### Linux/Mac:
```bash
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"
```

## Testing Email Configuration:

1. **Check configuration status**:
   ```
   GET http://localhost:3001/api/email/config
   ```

2. **Test email sending**:
   ```
   POST http://localhost:3001/api/email/test
   {
     "to": "test@example.com",
     "emailType": "newEmployee"
   }
   ```

## Current Status:
- ❌ SMTP credentials not configured
- ❌ Emails not being sent when employees are added
- ✅ Email templates are ready
- ✅ Email service is properly integrated

## Next Steps:
1. Choose an email provider (Gmail recommended)
2. Set up SMTP credentials
3. Restart the server
4. Test email functionality
5. Add a new employee to verify emails are sent







