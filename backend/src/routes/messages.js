import { Router } from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { authenticateToken } from '../middleware/auth.js';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../sequelize.js';

const router = Router();

// Helper function to get actual table columns for messages
async function getMessageTableColumns() {
  try {
    const [results] = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'messages' 
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );
    return results.map((r) => r.column_name);
  } catch (error) {
    console.error("Error getting messages table columns:", error);
    // Return default columns if query fails
    return ['id', 'senderEmail', 'senderName', 'recipientEmail', 'recipientName', 'content', 'createdAt', 'updatedAt'];
  }
}

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
    
    if (!userEmail) {
      return res.status(400).json({ message: 'Unable to determine user email' });
    }
    
    // Get actual table columns
    const columns = await getMessageTableColumns();
    const hasRead = columns.includes('read');
    const hasReadAt = columns.includes('readAt');
    const hasChannelId = columns.includes('channelId');
    const hasChannelName = columns.includes('channelName');
    const hasAttachments = columns.includes('attachments');
    const hasCreatedAt = columns.includes('createdAt');
    const hasUpdatedAt = columns.includes('updatedAt');

    // Build attributes list
    const attributes = ['id', 'senderEmail', 'senderName', 'recipientEmail', 'recipientName', 'content'];
    if (hasRead) attributes.push('read');
    if (hasReadAt) attributes.push('readAt');
    if (hasChannelId) attributes.push('channelId');
    if (hasChannelName) attributes.push('channelName');
    if (hasAttachments) attributes.push('attachments');
    if (hasCreatedAt) attributes.push('createdAt');
    if (hasUpdatedAt) attributes.push('updatedAt');

    // Get all messages where user is sender or recipient
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderEmail: userEmail },
          { recipientEmail: userEmail }
        ]
      },
      order: hasCreatedAt ? [['createdAt', 'DESC']] : [['id', 'DESC']],
      attributes: attributes
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Get conversation between two users
router.get('/conversation/:recipientEmail', authenticateToken, async (req, res) => {
  try {
    const senderEmail = await getUserEmailFromToken(req);
    
    if (!senderEmail) {
      return res.status(400).json({ message: 'Unable to determine user email' });
    }
    
    const recipientEmail = decodeURIComponent(req.params.recipientEmail);

    // Get actual table columns
    const columns = await getMessageTableColumns();
    const hasRead = columns.includes('read');
    const hasReadAt = columns.includes('readAt');
    const hasChannelId = columns.includes('channelId');
    const hasChannelName = columns.includes('channelName');
    const hasAttachments = columns.includes('attachments');
    const hasCreatedAt = columns.includes('createdAt');
    const hasUpdatedAt = columns.includes('updatedAt');

    // Build attributes list
    const attributes = ['id', 'senderEmail', 'senderName', 'recipientEmail', 'recipientName', 'content'];
    if (hasRead) attributes.push('read');
    if (hasReadAt) attributes.push('readAt');
    if (hasChannelId) attributes.push('channelId');
    if (hasChannelName) attributes.push('channelName');
    if (hasAttachments) attributes.push('attachments');
    if (hasCreatedAt) attributes.push('createdAt');
    if (hasUpdatedAt) attributes.push('updatedAt');

    // Build where clause
    const whereClause = {
      [Op.or]: [
        {
          senderEmail: senderEmail,
          recipientEmail: recipientEmail
        },
        {
          senderEmail: recipientEmail,
          recipientEmail: senderEmail
        }
      ]
    };
    
    if (hasChannelId) {
      whereClause.channelId = null; // Only direct messages
    }

    const messages = await Message.findAll({
      where: whereClause,
      order: hasCreatedAt ? [['createdAt', 'ASC']] : [['id', 'ASC']],
      attributes: attributes
    });

    // Mark messages as read (only if read column exists)
    if (hasRead) {
      const updateData = { read: true };
      if (hasReadAt) {
        updateData.readAt = new Date();
      }
      await Message.update(
        updateData,
        {
          where: {
            recipientEmail: senderEmail,
            senderEmail: recipientEmail,
            read: false
          }
        }
      );
    }

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

    // Get actual table columns
    const columns = await getMessageTableColumns();
    const hasRead = columns.includes('read');
    const hasReadAt = columns.includes('readAt');
    const hasChannelId = columns.includes('channelId');
    const hasChannelName = columns.includes('channelName');
    const hasAttachments = columns.includes('attachments');
    const hasCreatedAt = columns.includes('createdAt');
    const hasUpdatedAt = columns.includes('updatedAt');

    // Build attributes list based on what exists
    const attributes = ['id', 'senderEmail', 'senderName', 'recipientEmail', 'recipientName', 'content'];
    if (hasRead) attributes.push('read');
    if (hasReadAt) attributes.push('readAt');
    if (hasChannelId) attributes.push('channelId');
    if (hasChannelName) attributes.push('channelName');
    if (hasAttachments) attributes.push('attachments');
    if (hasCreatedAt) attributes.push('createdAt');
    if (hasUpdatedAt) attributes.push('updatedAt');

    // Build where clause
    const whereClause = {
      [Op.or]: [
        { senderEmail: userEmail, recipientEmail: { [Op.ne]: null } },
        { recipientEmail: userEmail, senderEmail: { [Op.ne]: null } }
      ]
    };
    
    // Only filter by channelId if the column exists
    if (hasChannelId) {
      whereClause.channelId = null; // Only direct messages
    }

    // Get all messages for this user
    const allMessages = await Message.findAll({
      where: whereClause,
      order: hasCreatedAt ? [['createdAt', 'DESC']] : [['id', 'DESC']],
      attributes: attributes
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

    // Calculate unread counts for each conversation (only if read column exists)
    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        let unreadCount = 0;
        if (hasRead) {
          unreadCount = await Message.count({
            where: {
              senderEmail: conv.email,
              recipientEmail: userEmail,
              read: false
            }
          });
        }

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
    console.error('Error stack:', error.stack);
    console.error('Request user object:', req.user);
    res.status(500).json({ 
      message: 'Error fetching conversations', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    // Get actual table columns
    const columns = await getMessageTableColumns();
    const hasRead = columns.includes('read');
    const hasReadAt = columns.includes('readAt');
    const hasChannelId = columns.includes('channelId');
    const hasChannelName = columns.includes('channelName');
    const hasAttachments = columns.includes('attachments');

    // Build message data based on what columns exist
    const messageData = {
      senderEmail: senderEmail,
      senderName: sender.name,
      recipientEmail: recipientEmail || null,
      recipientName: recipientName,
      content: content.trim()
    };

    if (hasChannelId) {
      messageData.channelId = channelId || null;
    }
    if (hasChannelName) {
      messageData.channelName = channelName || null;
    }
    if (hasRead) {
      messageData.read = false;
    }

    const message = await Message.create(messageData);

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

    // Get actual table columns
    const columns = await getMessageTableColumns();
    const hasRead = columns.includes('read');
    const hasReadAt = columns.includes('readAt');

    if (hasRead) {
      const updateData = { read: true };
      if (hasReadAt) {
        updateData.readAt = new Date();
      }
      await Message.update(
        updateData,
        {
          where: {
            senderEmail: senderEmail,
            recipientEmail: recipientEmail,
            read: false
          }
        }
      );
    }

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

    // Get actual table columns
    const columns = await getMessageTableColumns();
    const hasRead = columns.includes('read');

    let count = 0;
    if (hasRead) {
      count = await Message.count({
        where: {
          recipientEmail: userEmail,
          read: false
        }
      });
    }

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count', error: error.message });
  }
});

export default router;

