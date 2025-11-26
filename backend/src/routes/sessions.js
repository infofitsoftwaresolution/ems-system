import { Router } from 'express';
import { UserSession } from '../models/UserSession.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = Router();

// Get all active sessions for current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    
    const sessions = await UserSession.findAll({
      where: {
        userId,
        isActive: true,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      },
      order: [['lastActivity', 'DESC']]
    });
    
    const sessionsData = sessions.map(session => {
      const sessionData = session.toJSON();
      let deviceInfo = {};
      try {
        deviceInfo = session.deviceInfo ? JSON.parse(session.deviceInfo) : {};
      } catch (e) {
        deviceInfo = {};
      }
      
      return {
        id: sessionData.id,
        deviceInfo,
        userAgent: sessionData.userAgent,
        ipAddress: sessionData.ipAddress,
        lastActivity: sessionData.lastActivity,
        createdAt: sessionData.createdAt,
        isCurrent: sessionData.token === currentToken
      };
    });
    
    res.json({ success: true, sessions: sessionsData });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});

// Revoke a specific session
router.delete('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const { sessionId } = req.params;
    
    const session = await UserSession.findOne({
      where: {
        id: sessionId,
        userId,
        isActive: true
      }
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    await session.update({ isActive: false });
    
    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ message: 'Error revoking session', error: error.message });
  }
});

// Revoke all other sessions (keep current one)
router.delete('/me/others', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    
    const result = await UserSession.update(
      { isActive: false },
      {
        where: {
          userId,
          token: { [Op.ne]: currentToken },
          isActive: true
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'All other sessions revoked successfully',
      revokedCount: result[0]
    });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    res.status(500).json({ message: 'Error revoking sessions', error: error.message });
  }
});

// Revoke all sessions including current
router.delete('/me/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    
    await UserSession.update(
      { isActive: false },
      {
        where: {
          userId,
          isActive: true
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'All sessions revoked successfully. Please log in again.'
    });
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    res.status(500).json({ message: 'Error revoking sessions', error: error.message });
  }
});

export default router;

