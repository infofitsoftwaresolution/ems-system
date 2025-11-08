// Gmail Credentials Verification
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Gmail Credentials Verification');
console.log('==================================');
console.log('');

console.log('Current Configuration:');
console.log('Email:', process.env.SMTP_USER);
console.log('Password Length:', process.env.SMTP_PASS.length);
console.log('Password Preview:', process.env.SMTP_PASS.substring(0, 4) + '...' + process.env.SMTP_PASS.substring(12));
console.log('');

// Test with different Gmail configurations
const configs = [
  {
    name: 'Gmail Service (Recommended)',
    config: {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },
  {
    name: 'Gmail SMTP Port 587',
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
    name: 'Gmail SMTP Port 465',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }
];

async function testConfig(config) {
  try {
    const transporter = nodemailer.createTransport(config.config);
    await transporter.verify();
    console.log(`✅ ${config.name} - SUCCESS!`);
    return true;
  } catch (error) {
    console.log(`❌ ${config.name} - FAILED: ${error.message}`);
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
  }
  
  if (success) {
    console.log('');
    console.log('🎉 Gmail authentication is working!');
    console.log('Employee emails will be sent automatically.');
  } else {
    console.log('');
    console.log('❌ All Gmail configurations failed.');
    console.log('');
    console.log('🔧 Possible Solutions:');
    console.log('1. Check if 2-Factor Authentication is enabled');
    console.log('2. Generate a NEW App Password:');
    console.log('   - Go to Google Account → Security → 2-Step Verification');
    console.log('   - Click "App passwords" → Delete old password');
    console.log('   - Generate new password for "Mail"');
    console.log('   - Copy the 16-character password');
    console.log('3. Make sure you\'re using the App Password, not your regular Gmail password');
    console.log('4. Check if the email address is correct');
  }
}

testAllConfigs().then(() => {
  process.exit(0);
});


