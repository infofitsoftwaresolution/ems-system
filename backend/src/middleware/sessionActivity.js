import { UserSession } from '../models/UserSession.js';
import { Op } from 'sequelize';

/**
 * Middleware to update session activity timestamp on each authenticated request
 */
export async function updateSessionActivity(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Update last activity for this session
      await UserSession.update(
        { lastActivity: new Date() },
        {
          where: {
            token,
            isActive: true,
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: new Date() } }
            ]
          }
        }
      );
    }
  } catch (error) {
    // Don't fail the request if session update fails
    console.error('Error updating session activity:', error);
  }
  
  next();
}

