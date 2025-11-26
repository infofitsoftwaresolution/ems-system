import { Router } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

// Configure authenticator
authenticator.options = {
  step: 30, // 30 seconds
  window: 1
};

const router = Router();

// Generate a secret and QR code for 2FA setup
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a secret
    const secret = authenticator.generateSecret();
    
    // Create service name and account name for QR code
    const serviceName = process.env.APP_NAME || 'EMS System';
    const accountName = user.email;
    const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret);
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    
    // Store the secret temporarily (user hasn't verified yet)
    await user.update({ twoFactorSecret: secret });
    
    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    
    res.json({
      success: true,
      secret,
      qrCodeUrl,
      backupCodes,
      message: 'Scan the QR code with your authenticator app and verify to enable 2FA'
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ message: 'Error setting up 2FA', error: error.message });
  }
});

// Verify and enable 2FA
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { token, backupCodes } = req.body;
    const userId = req.user.sub || req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup not initiated. Please set up 2FA first.' });
    }
    
    // Verify the token
    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Store backup codes and enable 2FA
    const backupCodesJson = JSON.stringify(backupCodes || []);
    await user.update({
      twoFactorEnabled: true,
      twoFactorBackupCodes: backupCodesJson
    });
    
    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ message: 'Error verifying 2FA', error: error.message });
  }
});

// Disable 2FA
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null
    });
    
    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ message: 'Error disabling 2FA', error: error.message });
  }
});

// Get 2FA status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'twoFactorEnabled', 'twoFactorSecret']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled || false,
      isSetup: !!user.twoFactorSecret
    });
  } catch (error) {
    console.error('Error fetching 2FA status:', error);
    res.status(500).json({ message: 'Error fetching 2FA status', error: error.message });
  }
});

// Verify backup code
router.post('/verify-backup', async (req, res) => {
  try {
    const { email, backupCode } = req.body;
    
    if (!email || !backupCode) {
      return res.status(400).json({ message: 'Email and backup code are required' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorBackupCodes) {
      return res.status(400).json({ message: 'No backup codes available' });
    }
    
    let backupCodes = [];
    try {
      backupCodes = JSON.parse(user.twoFactorBackupCodes);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid backup codes format' });
    }
    
    const codeIndex = backupCodes.indexOf(backupCode.toUpperCase());
    
    if (codeIndex === -1) {
      return res.status(400).json({ message: 'Invalid backup code' });
    }
    
    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await user.update({
      twoFactorBackupCodes: JSON.stringify(backupCodes)
    });
    
    res.json({
      success: true,
      message: 'Backup code verified successfully'
    });
  } catch (error) {
    console.error('Error verifying backup code:', error);
    res.status(500).json({ message: 'Error verifying backup code', error: error.message });
  }
});

export default router;

