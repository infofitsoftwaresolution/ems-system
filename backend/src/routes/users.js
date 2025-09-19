import { Router } from 'express';
import { User } from '../models/User.js';

const router = Router();

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

// Update user
router.put('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update(updateData);
    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

export default router;
