import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admins can get all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'active', 'createdAt'],
      where: { active: true },
      order: [['name', 'ASC']]
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Delete user by email
router.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Get user by email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'name', 'role', 'active', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user profile
router.put('/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;
    
    // Only allow users to update their own profile, or admins to update any profile
    if (req.user.email !== email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Handle JSON fields
    if (updateData.notificationSettings && typeof updateData.notificationSettings === 'object') {
      updateData.notificationSettings = JSON.stringify(updateData.notificationSettings);
    }
    if (updateData.securitySettings && typeof updateData.securitySettings === 'object') {
      updateData.securitySettings = JSON.stringify(updateData.securitySettings);
    }
    
    await user.update(updateData);
    
    // Return user with parsed JSON fields
    const updatedUser = user.toJSON();
    if (updatedUser.notificationSettings) {
      try {
        updatedUser.notificationSettings = JSON.parse(updatedUser.notificationSettings);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    if (updatedUser.securitySettings) {
      try {
        updatedUser.securitySettings = JSON.parse(updatedUser.securitySettings);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    
    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Get current user profile with settings
router.get('/me/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { email: req.user.email },
      attributes: ['id', 'name', 'email', 'role', 'avatar', 'phone', 'bio', 'language', 'timezone', 'notificationSettings', 'securitySettings']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = user.toJSON();
    // Parse JSON fields
    if (userData.notificationSettings) {
      try {
        userData.notificationSettings = JSON.parse(userData.notificationSettings);
      } catch (e) {
        userData.notificationSettings = {};
      }
    } else {
      userData.notificationSettings = {};
    }
    
    if (userData.securitySettings) {
      try {
        userData.securitySettings = JSON.parse(userData.securitySettings);
      } catch (e) {
        userData.securitySettings = {};
      }
    } else {
      userData.securitySettings = {};
    }
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Upload avatar
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findOne({ where: { email: req.user.email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Construct the avatar URL (relative path)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await user.update({ avatar: avatarUrl });
    
    res.json({ 
      success: true, 
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error uploading avatar', error: error.message });
  }
});

// Remove avatar
router.delete('/remove-avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.user.email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Optionally delete the file from disk
    if (user.avatar) {
      const fs = await import('fs');
      const filePath = path.join(__dirname, '../../', user.avatar);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error('Error deleting avatar file:', fileError);
        // Continue even if file deletion fails
      }
    }
    
    await user.update({ avatar: null });
    
    res.json({ 
      success: true, 
      message: 'Avatar removed successfully' 
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    res.status(500).json({ message: 'Error removing avatar', error: error.message });
  }
});

export default router;
