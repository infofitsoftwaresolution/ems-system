// Fix Email Authentication Issues
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Email Authentication Fix');
console.log('===========================');
console.log('');

// Test different authentication methods
async function testEmailAuth() {
  console.log('Testing Gmail authentication...');
  console.log('Email:', process.env.SMTP_USER);
  console.log('Password length:', process.env.SMTP_PASS.length);
  console.log('');

  // Method 1: Standard Gmail SMTP
  console.log('Method 1: Standard Gmail SMTP');
  try {
    const transporter1 = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter1.verify();
    console.log('✅ Standard Gmail SMTP works!');
    return true;
  } catch (error) {
    console.log('❌ Standard Gmail SMTP failed:', error.message);
  }

  // Method 2: Gmail with OAuth2 (if App Password doesn't work)
  console.log('');
  console.log('Method 2: Gmail with explicit settings');
  try {
    const transporter2 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter2.verify();
    console.log('✅ Gmail with port 587 works!');
    return true;
  } catch (error) {
    console.log('❌ Gmail with port 587 failed:', error.message);
  }

  // Method 3: Gmail with SSL
  console.log('');
  console.log('Method 3: Gmail with SSL');
  try {
    const transporter3 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter3.verify();
    console.log('✅ Gmail with SSL works!');
    return true;
  } catch (error) {
    console.log('❌ Gmail with SSL failed:', error.message);
  }

  return false;
}

// Run the test
testEmailAuth().then(success => {
  if (success) {
    console.log('');
    console.log('🎉 Email authentication is working!');
    console.log('Employee emails will be sent automatically.');
  } else {
    console.log('');
    console.log('❌ All authentication methods failed.');
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check if 2-Factor Authentication is enabled');
    console.log('2. Generate a new App Password');
    console.log('3. Make sure the App Password is 16 characters');
    console.log('4. Try logging into Gmail with the App Password');
    console.log('');
    console.log('📧 Alternative: Use a different email service');
    console.log('- Outlook: smtp-mail.outlook.com:587');
    console.log('- Yahoo: smtp.mail.yahoo.com:587');
  }
  
  process.exit(0);
});
