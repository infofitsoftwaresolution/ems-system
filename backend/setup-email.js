// Email Setup Script for Rural Samridhi EMS
// This script helps configure email settings

import dotenv from 'dotenv';
import { sendEmail } from './src/services/emailService.js';

// Load environment variables
dotenv.config();

console.log('🔧 Email Configuration Setup');
console.log('============================');

// Check current email configuration
console.log('Current SMTP Configuration:');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
console.log('');

// Test email configuration
async function testEmailConfiguration() {
  console.log('📧 Testing Email Configuration...');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Email configuration is incomplete!');
    console.log('');
    console.log('To fix this:');
    console.log('1. Set up Gmail App Password:');
    console.log('   - Go to Google Account → Security → 2-Step Verification');
    console.log('   - Generate App Password for "Mail"');
    console.log('2. Update your .env file with:');
    console.log('   SMTP_USER=your-email@gmail.com');
    console.log('   SMTP_PASS=your-app-password');
    console.log('');
    return false;
  }
  
  try {
    // Test email sending
    const testData = {
      fullName: 'Test User',
      email: process.env.SMTP_USER, // Send test email to yourself
      tempEmployeeId: 'TEST123',
      tempPassword: 'test123'
    };
    
    const result = await sendEmail(testData.email, 'newEmployee', testData);
    
    if (result.success) {
      console.log('✅ Email configuration is working!');
      console.log('Test email sent successfully.');
      return true;
    } else {
      console.log('❌ Email sending failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
    return false;
  }
}

// Run the test
testEmailConfiguration().then(success => {
  if (success) {
    console.log('');
    console.log('🎉 Email service is ready!');
    console.log('Employee notifications will be sent automatically.');
  } else {
    console.log('');
    console.log('⚠️  Email service needs configuration.');
    console.log('Employee notifications will not be sent until configured.');
  }
  process.exit(0);
});


