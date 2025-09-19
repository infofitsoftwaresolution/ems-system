import { Router } from 'express';
import { sendEmail } from '../services/emailService.js';

const router = Router();

// Test email endpoint
router.post('/test', async (req, res) => {
  try {
    const { to, emailType } = req.body;
    
    if (!to) {
      return res.status(400).json({ 
        error: 'Email address is required',
        message: 'Please provide a valid email address in the "to" field'
      });
    }

    let testData;
    let template;

    switch (emailType) {
      case 'newEmployee':
        template = 'newEmployee';
        testData = {
          fullName: 'Test Employee',
          email: to,
          tempEmployeeId: 'TEMP123456789',
          tempPassword: 'temp123'
        };
        break;
      case 'kycApproved':
        template = 'kycApproved';
        testData = {
          fullName: 'Test Employee',
          email: to,
          permanentEmployeeId: 'EMP20250001',
          password: 'Your set password'
        };
        break;
      case 'kycReminder':
        template = 'kycReminder';
        testData = {
          fullName: 'Test Employee',
          email: to
        };
        break;
      default:
        return res.status(400).json({ 
          error: 'Invalid email type',
          message: 'Valid types: newEmployee, kycApproved, kycReminder'
        });
    }

    const result = await sendEmail(to, template, testData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${to}`,
        messageId: result.messageId,
        emailType: emailType
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ 
      error: 'Email test failed',
      details: error.message 
    });
  }
});

// Email configuration status
router.get('/config', (req, res) => {
  const config = {
    emailUser: process.env.SMTP_USER || 'Not configured',
    emailPassword: process.env.SMTP_PASS ? 'Configured' : 'Not configured',
    isConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  };
  
  res.json(config);
});

export default router;
