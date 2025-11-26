import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { UserSession } from '../models/UserSession.js';

const router = Router();

// Helper function to parse user agent and get device info
function getDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Simple device detection
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    device = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
  }
  
  return {
    browser,
    os,
    device,
    ip: ipAddress
  };
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);
  const user = await User.findOne({ where: { email, active: true } });
  if (!user) {
    console.log('User not found or inactive for email:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  console.log('User found:', user.email, 'Role:', user.role);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    console.log('Password mismatch for email:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  console.log('Login successful for:', email);
  
  // Get employee KYC status
  console.log('Looking up employee for email:', user.email);
  const employee = await Employee.findOne({ where: { email: user.email } });
  const kycStatus = employee ? employee.kycStatus : 'unknown';
  console.log('Found employee:', employee ? 'Yes' : 'No', 'KYC Status:', kycStatus);
  console.log('Full employee object:', employee);
  
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '2h'
  });
  
  // Create session record
  try {
    const deviceInfo = getDeviceInfo(req);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours from now
    
    await UserSession.create({
      userId: user.id,
      token,
      deviceInfo: JSON.stringify(deviceInfo),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: deviceInfo.ip,
      lastActivity: new Date(),
      expiresAt
    });
  } catch (sessionError) {
    console.error('Error creating session:', sessionError);
    // Don't fail login if session creation fails
  }
  
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      kycStatus: kycStatus
    },
    requirePasswordSetup: user.mustChangePassword,
    debug: "KYC status included in response"
  });
});

router.post('/update-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword, forceChange } = req.body;
    
    console.log('Password update request received:', { 
      email: email ? 'provided' : 'missing', 
      hasNewPassword: !!newPassword, 
      forceChange: !!forceChange 
    });
    
    if (!email || !newPassword) {
      console.error('Missing required fields:', { email: !!email, newPassword: !!newPassword });
      return res.status(400).json({ 
        success: false,
        message: 'Email and new password are required' 
      });
    }
    
    const user = await User.findOne({ where: { email, active: true } });
    if (!user) {
      console.error('User not found or inactive:', email);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if this is a forced password change (mustChangePassword = true)
    const isForcedChange = forceChange || user.mustChangePassword;
    
    if (isForcedChange) {
      // For forced password changes, verify token instead of current password
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Missing or invalid authorization header for forced password change');
        return res.status(401).json({ 
          success: false,
          message: 'Authentication token required for forced password change' 
        });
      }
      
      const token = authHeader.substring(7);
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ 
          success: false,
          message: 'Invalid or expired token' 
        });
      }
      
      // Verify the token belongs to the user
      if (decoded.sub !== user.id) {
        console.error('Token user ID mismatch:', { tokenUserId: decoded.sub, userEmail: user.email });
        return res.status(403).json({ 
          success: false,
          message: 'Token does not match user' 
        });
      }
      
      // Verify user actually needs to change password
      if (!user.mustChangePassword && !forceChange) {
        console.warn('Password change not required for user:', email);
        return res.status(400).json({ 
          success: false,
          message: 'Password change is not required for this user' 
        });
      }
    } else {
      // Regular password change requires current password
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'Current password is required' 
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: 'Current password is incorrect' 
        });
      }
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be at least 8 characters long' 
      });
    }
    
    // Hash and update password
    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    user.mustChangePassword = false;
    await user.save();
    
    console.log('Password updated successfully for user:', email);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating password', 
      error: error.message 
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    const user = await User.findByPk(decoded.sub, {
      attributes: ['id', 'name', 'email', 'role', 'active', 'mustChangePassword', 'avatar']
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Get employee KYC status
    const employee = await Employee.findOne({ where: { email: user.email } });
    const kycStatus = employee ? employee.kycStatus : 'unknown';

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      kycStatus: kycStatus,
      avatar: user.avatar
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// List all users (for debugging)
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'active', 'mustChangePassword']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Create test user with temporary password
router.post('/create-test-user', async (req, res) => {
  try {
    const { email, name, role = 'employee' } = req.body;
    const tempPassword = 'temp123';
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // Update existing user with new password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      await existingUser.update({
        passwordHash: hashedPassword,
        mustChangePassword: true,
        active: true,
        name: name || existingUser.name
      });
      
      return res.json({ 
        success: true, 
        message: 'User account updated successfully',
        credentials: {
          email: email,
          password: tempPassword
        }
      });
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const user = await User.create({
      name: name || 'Test User',
      email: email,
      passwordHash: hashedPassword,
      role: role,
      mustChangePassword: true,
      active: true
    });
    
    res.json({ 
      success: true, 
      message: 'Test user account created successfully',
      credentials: {
        email: email,
        password: tempPassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Set specific password for a user
router.post('/set-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the password
    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      passwordHash: hashedPassword,
      mustChangePassword: true,
      active: true
    });
    
    res.json({ 
      success: true, 
      message: 'Password updated successfully',
      credentials: {
        email: email,
        password: password
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
});

// Create user account for Shubham Singh (for testing)
router.post('/create-shubham-user', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'shubhamsinghrajput6087@gmail.com' } });
    if (existingUser) {
      // Update existing user with new password
      const hashedPassword = await bcrypt.hash('temp123', 10);
      await existingUser.update({
        passwordHash: hashedPassword,
        mustChangePassword: true,
        active: true
      });
      
      return res.json({ 
        success: true, 
        message: 'Shubham Singh user account updated successfully',
        credentials: {
          email: 'shubhamsinghrajput6087@gmail.com',
          password: 'temp123'
        }
      });
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash('temp123', 10);
    
    const user = await User.create({
      name: 'Shubham Singh',
      email: 'shubhamsinghrajput6087@gmail.com',
      passwordHash: hashedPassword,
      role: 'employee',
      mustChangePassword: true,
      active: true
    });
    
    res.json({ 
      success: true, 
      message: 'Shubham Singh user account created successfully',
      credentials: {
        email: 'shubhamsinghrajput6087@gmail.com',
        password: 'temp123'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

export default router;


