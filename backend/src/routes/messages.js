import { Router } from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = Router();

// Helper function to get user email from token
const getUserEmailFromToken = async (req) => {
  try {
    // Try multiple ways to get user ID
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      console.error('No user ID found in token:', req.user);
      return null;
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('User not found for ID:', userId);
      return null;
    }
    return user.email;
  } catch (error) {
    console.error('Error getting user email from token:', error);
    return null;
  }
};

// Get all messages for the current user (both sent and received)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);
    
    // Get all messages where user is sender or recipient
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderEmail: userEmail },
          { recipientEmail: userEmail }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Get conversation between two users
router.get('/conversation/:recipientEmail', authenticateToken, async (req, res) => {
  try {
    const senderEmail = await getUserEmailFromToken(req);
    const recipientEmail = decodeURIComponent(req.params.recipientEmail);

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderEmail: senderEmail,
            recipientEmail: recipientEmail
          },
          {
            senderEmail: recipientEmail,
            recipientEmail: senderEmail
          }
        ],
        channelId: null // Only direct messages
      },
      order: [['createdAt', 'ASC']]
    });

    // Mark messages as read
    await Message.update(
      { read: true, readAt: new Date() },
      {
        where: {
          recipientEmail: senderEmail,
          senderEmail: recipientEmail,
          read: false
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
});

// Get all conversations for the current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);
    
    if (!userEmail) {
      return res.status(400).json({ message: 'Unable to determine user email' });
    }

    // Get all messages for this user
    const allMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderEmail: userEmail, recipientEmail: { [Op.ne]: null } },
          { recipientEmail: userEmail, senderEmail: { [Op.ne]: null } }
        ],
        channelId: null // Only direct messages
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'senderEmail', 'senderName', 'recipientEmail', 'recipientName', 'content', 'createdAt', 'read', 'channelId']
    });

    // Group by conversation partner
    const conversationMap = new Map();

    allMessages.forEach((msg) => {
      const partnerEmail = msg.senderEmail === userEmail ? msg.recipientEmail : msg.senderEmail;
      const partnerName = msg.senderEmail === userEmail ? msg.recipientName : msg.senderName;

      if (!partnerEmail) return;

      if (!conversationMap.has(partnerEmail)) {
        conversationMap.set(partnerEmail, {
          email: partnerEmail,
          name: partnerName || partnerEmail.split('@')[0],
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unread: 0
        });
      } else {
        const existing = conversationMap.get(partnerEmail);
        // Update if this message is more recent
        if (new Date(msg.createdAt) > new Date(existing.lastMessageTime)) {
          existing.lastMessage = msg.content;
          existing.lastMessageTime = msg.createdAt;
        }
      }
    });

    // Calculate unread counts for each conversation
    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        const unreadCount = await Message.count({
          where: {
            senderEmail: conv.email,
            recipientEmail: userEmail,
            read: false
          }
        });

        return {
          ...conv,
          unread: unreadCount
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
});

// Send a message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipientEmail, content, channelId, channelName } = req.body;
    const senderEmail = await getUserEmailFromToken(req);

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Get sender info
    const sender = await User.findOne({ where: { email: senderEmail } });
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    let recipientName = null;
    if (recipientEmail) {
      const recipient = await User.findOne({ where: { email: recipientEmail } });
      if (!recipient) {
        // Try Employee table
        const employee = await Employee.findOne({ where: { email: recipientEmail } });
        if (employee) {
          recipientName = employee.name;
        }
      } else {
        recipientName = recipient.name;
      }
    }

    const message = await Message.create({
      senderEmail: senderEmail,
      senderName: sender.name,
      recipientEmail: recipientEmail || null,
      recipientName: recipientName,
      channelId: channelId || null,
      channelName: channelName || null,
      content: content.trim(),
      read: false
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Mark messages as read
router.put('/read', authenticateToken, async (req, res) => {
  try {
    const { senderEmail } = req.body;
    const recipientEmail = await getUserEmailFromToken(req);

    await Message.update(
      { read: true, readAt: new Date() },
      {
        where: {
          senderEmail: senderEmail,
          recipientEmail: recipientEmail,
          read: false
        }
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);

    const count = await Message.count({
      where: {
        recipientEmail: userEmail,
        read: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count', error: error.message });
  }
});

export default router;

