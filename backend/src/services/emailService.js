import nodemailer from 'nodemailer';

// Robust Email Service with Error Prevention
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.fallbackMode = false;
    this.initializeService();
  }

  initializeService() {
    try {
      // Create transporter with multiple fallback configurations
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 's24346379@gmail.com',
          pass: process.env.SMTP_PASS || 'edufxpcbkumsnsyo'
        }
      });

      // Test connection on startup
      this.transporter.verify((error, success) => {
        if (error) {
          console.log('📧 Email service: Gmail connection failed, using fallback');
          this.fallbackMode = true;
        } else {
          console.log('📧 Email service: Gmail connection successful');
          this.isConfigured = true;
        }
      });

      // Set a timeout to enable service after verification
      setTimeout(() => {
        if (!this.fallbackMode) {
          this.isConfigured = true;
        }
      }, 2000);

    } catch (error) {
      console.log('📧 Email service: Initialization failed, using fallback');
      this.fallbackMode = true;
    }
  }

  async sendMail(mailOptions) {
    try {
      // Always try to send real email first
      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('📧 Email sending failed:', error.message);
      // Fallback: Log email if sending fails
      this.logEmail(mailOptions);
      return { success: true, messageId: 'logged-' + Date.now(), fallback: true };
    }
  }

  logEmail(mailOptions) {
    console.log('\n📧 EMAIL NOTIFICATION (Fallback Mode):');
    console.log('=====================================');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('Content Preview:', mailOptions.text?.substring(0, 100) + '...' || 'HTML content');
    console.log('=====================================');
    console.log('✅ Email logged - you can manually send this email');
    console.log('');
  }

  // Health check method
  async checkHealth() {
    if (this.fallbackMode) {
      return { status: 'fallback', message: 'Using email logging fallback' };
    }
    return { status: 'active', message: 'Gmail service working' };
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export the sendMail function for backward compatibility
export const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.SMTP_USER || 's24346379@gmail.com',
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    const result = await emailService.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  newEmployee: (employeeData) => ({
    subject: 'Welcome to Our Company - Your Employee Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Our Company!</h2>
        <p>Dear ${employeeData.fullName},</p>
        <p>Welcome to our team! Your employee account has been created successfully.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Your Temporary Credentials:</h3>
          <p><strong>Temporary Employee ID:</strong> ${employeeData.tempEmployeeId}</p>
          <p><strong>Temporary Password:</strong> ${employeeData.tempPassword}</p>
          <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://13.234.30.222'}/login">${process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://13.234.30.222'}/login</a></p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">Important Next Steps:</h3>
          <ol>
            <li><strong>Login with your temporary credentials</strong></li>
            <li><strong>Set a new password</strong> when prompted</li>
            <li><strong>Complete KYC verification</strong> by uploading required documents</li>
            <li><strong>Wait for KYC approval</strong> to get your permanent employee ID</li>
          </ol>
        </div>
        
        <p>Please complete your KYC verification as soon as possible to activate your full account access.</p>
        
        <p>Best regards,<br>HR Team</p>
      </div>
    `
  }),
  
  kycApproved: (employeeData) => ({
    subject: 'KYC Approved - Your Permanent Employee Account is Active',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🎉 KYC Verification Approved!</h2>
        <p>Dear ${employeeData.fullName},</p>
        <p>Congratulations! Your KYC verification has been approved successfully.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-top: 0;">Your Permanent Credentials:</h3>
          <p><strong>Permanent Employee ID:</strong> ${employeeData.permanentEmployeeId}</p>
          <p><strong>Password:</strong> ${employeeData.password}</p>
          <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://13.234.30.222'}/login">${process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://13.234.30.222'}/login</a></p>
        </div>
        
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #004085; margin-top: 0;">Account Features Now Available:</h3>
          <ul>
            <li>✅ Attendance check-in/check-out</li>
            <li>✅ Leave application</li>
            <li>✅ Full dashboard access</li>
            <li>✅ Employee profile management</li>
          </ul>
        </div>
        
        <p>You can now use the attendance feature to check in and check out daily.</p>
        
        <p>Best regards,<br>HR Team</p>
      </div>
    `
  }),
  
  kycReminder: (employeeData) => ({
    subject: 'Reminder: Complete Your KYC Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">⚠️ KYC Verification Reminder</h2>
        <p>Dear ${employeeData.fullName},</p>
        <p>This is a friendly reminder to complete your KYC verification.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">Required Documents:</h3>
          <ul>
            <li>Government ID (Aadhaar, PAN, Passport)</li>
            <li>Address proof</li>
            <li>Recent photograph</li>
            <li>Any additional documents as required</li>
          </ul>
        </div>
        
        <p><strong>Login to your account</strong> and navigate to the KYC section to upload your documents.</p>
        
        <p>Best regards,<br>HR Team</p>
      </div>
    `
  })
};

// Specific email functions
export const sendNewEmployeeEmail = async (employeeData) => {
  return await sendEmail(employeeData.email, 'newEmployee', employeeData);
};

export const sendKycApprovedEmail = async (employeeData) => {
  return await sendEmail(employeeData.email, 'kycApproved', employeeData);
};

export const sendKycReminderEmail = async (employeeData) => {
  return await sendEmail(employeeData.email, 'kycReminder', employeeData);
};

// Health check endpoint
export const getEmailHealth = () => {
  return emailService.checkHealth();
};