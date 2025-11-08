// Comprehensive Email Debug
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Comprehensive Email Debug');
console.log('============================');
console.log('');

console.log('Environment Variables:');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS Length:', process.env.SMTP_PASS?.length);
console.log('SMTP_PASS Preview:', process.env.SMTP_PASS?.substring(0, 4) + '...' + process.env.SMTP_PASS?.substring(12));
console.log('');

// Test multiple Gmail configurations
const configs = [
  {
    name: 'Gmail Service (Default)',
    config: {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },
  {
    name: 'Gmail SMTP 587 (TLS)',
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },
  {
    name: 'Gmail SMTP 465 (SSL)',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },
  {
    name: 'Gmail with STARTTLS',
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }
];

async function testConfig(config) {
  try {
    console.log(`Testing ${config.name}...`);
    const transporter = nodemailer.createTransport(config.config);
    
    // Test connection
    await transporter.verify();
    console.log(`✅ ${config.name} - Connection successful!`);
    
    // Test sending email
    const testMail = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Email from EMS',
      text: 'This is a test email from Rural Samridhi EMS system.',
      html: '<p>This is a test email from Rural Samridhi EMS system.</p>'
    };
    
    const result = await transporter.sendMail(testMail);
    console.log(`✅ ${config.name} - Email sent successfully!`);
    console.log(`Message ID: ${result.messageId}`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${config.name} - Failed: ${error.message}`);
    return false;
  }
}

async function testAllConfigs() {
  let success = false;
  
  for (const config of configs) {
    const result = await testConfig(config);
    if (result) {
      success = true;
      break;
    }
    console.log(''); // Add spacing between tests
  }
  
  if (success) {
    console.log('🎉 Email is working! Employee notifications will be sent automatically.');
  } else {
    console.log('❌ All Gmail configurations failed.');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Verify 2-Factor Authentication is enabled');
    console.log('2. Check if App Password is correct (16 characters)');
    console.log('3. Try generating a new App Password');
    console.log('4. Make sure you\'re using App Password, not regular password');
    console.log('');
    console.log('📧 Alternative: Use a different email service');
    console.log('- Outlook: smtp-mail.outlook.com:587');
    console.log('- Yahoo: smtp.mail.yahoo.com:587');
  }
}

testAllConfigs().then(() => {
  process.exit(0);
});


