import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

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
          <p><strong>Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
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
          <p><strong>Login URL:</strong> <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
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

// Email sending functions
export const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
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
