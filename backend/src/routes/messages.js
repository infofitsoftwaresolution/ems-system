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
    // Try information_schema query first
    const [results] = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'messages' 
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );
    
    // Handle both array and object formats
    if (Array.isArray(results) && results.length > 0) {
      return results.map((r) => r.column_name);
    }
    
    // Fallback: Try raw query to detect columns
    console.log('Trying raw query fallback to detect columns...');
    const [rawResults] = await sequelize.query(
      `SELECT * FROM messages LIMIT 1`,
      { type: QueryTypes.SELECT }
    );
    
    if (rawResults && rawResults.length > 0) {
      const columns = Object.keys(rawResults[0]);
      console.log('Detected columns from raw query:', columns);
      return columns;
    }
    
    return [];
  } catch (error) {
    console.error("Error getting messages table columns:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Last resort: Try raw query to detect columns
    try {
      const [rawResults] = await sequelize.query(
        `SELECT * FROM messages LIMIT 1`,
        { type: QueryTypes.SELECT }
      );
      if (rawResults && rawResults.length > 0) {
        return Object.keys(rawResults[0]);
      }
    } catch (e) {
      console.error("Raw query fallback also failed:", e);
    }
    
    return [];
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
    console.log('Messages table columns:', columns);
    
    // Check for different possible column name formats (camelCase, snake_case, etc.)
    const hasSenderEmail = columns.some(col => ['senderEmail', 'sender_email', 'senderemail'].includes(col));
    const hasSenderName = columns.some(col => ['senderName', 'sender_name', 'sendername'].includes(col));
    const hasRecipientEmail = columns.some(col => ['recipientEmail', 'recipient_email', 'recipientemail'].includes(col));
    const hasRecipientName = columns.some(col => ['recipientName', 'recipient_name', 'recipientname'].includes(col));
    const hasRead = columns.includes('read');
    const hasReadAt = columns.some(col => ['readAt', 'read_at'].includes(col));
    const hasChannelId = columns.some(col => ['channelId', 'channel_id'].includes(col));
    const hasChannelName = columns.some(col => ['channelName', 'channel_name'].includes(col));
    const hasAttachments = columns.includes('attachments');
    const hasCreatedAt = columns.some(col => ['createdAt', 'created_at'].includes(col));
    const hasUpdatedAt = columns.some(col => ['updatedAt', 'updated_at'].includes(col));
    
    // Find actual column names (handle different naming conventions)
    const senderEmailCol = columns.find(col => ['senderEmail', 'sender_email', 'senderemail'].includes(col)) || 'senderEmail';
    const senderNameCol = columns.find(col => ['senderName', 'sender_name', 'sendername'].includes(col)) || 'senderName';
    const recipientEmailCol = columns.find(col => ['recipientEmail', 'recipient_email', 'recipientemail'].includes(col)) || 'recipientEmail';
    const recipientNameCol = columns.find(col => ['recipientName', 'recipient_name', 'recipientname'].includes(col)) || 'recipientName';
    const createdAtCol = columns.find(col => ['createdAt', 'created_at'].includes(col)) || 'createdAt';

    // Build attributes list - only include columns that exist
    const attributes = ['id', 'content'];
    if (hasSenderEmail) attributes.push(senderEmailCol);
    if (hasSenderName) attributes.push(senderNameCol);
    if (hasRecipientEmail) attributes.push(recipientEmailCol);
    if (hasRecipientName) attributes.push(recipientNameCol);
    if (hasRead) attributes.push('read');
    if (hasReadAt) {
      const readAtCol = columns.find(col => ['readAt', 'read_at'].includes(col));
      if (readAtCol) attributes.push(readAtCol);
    }
    if (hasChannelId) {
      const channelIdCol = columns.find(col => ['channelId', 'channel_id'].includes(col));
      if (channelIdCol) attributes.push(channelIdCol);
    }
    if (hasChannelName) {
      const channelNameCol = columns.find(col => ['channelName', 'channel_name'].includes(col));
      if (channelNameCol) attributes.push(channelNameCol);
    }
    if (hasAttachments) attributes.push('attachments');
    if (hasCreatedAt) attributes.push(createdAtCol);
    if (hasUpdatedAt) {
      const updatedAtCol = columns.find(col => ['updatedAt', 'updated_at'].includes(col));
      if (updatedAtCol) attributes.push(updatedAtCol);
    }

    // Build where clause using actual column names
    const whereClause = {};
    if (hasSenderEmail && hasRecipientEmail) {
      whereClause[Op.or] = [
        { [senderEmailCol]: userEmail, [recipientEmailCol]: { [Op.ne]: null } },
        { [recipientEmailCol]: userEmail, [senderEmailCol]: { [Op.ne]: null } }
      ];
    } else if (hasSenderEmail) {
      whereClause[senderEmailCol] = userEmail;
    } else if (hasRecipientEmail) {
      whereClause[recipientEmailCol] = userEmail;
    } else {
      // If we can't determine columns, return empty array
      return res.json([]);
    }

    // Get all messages where user is sender or recipient
    const messages = await Message.findAll({
      where: whereClause,
      order: hasCreatedAt ? [[createdAtCol, 'DESC']] : [['id', 'DESC']],
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
    
    // Find actual column names (handle different naming conventions)
    const senderEmailCol = columns.find(col => ['senderEmail', 'sender_email', 'senderemail'].includes(col));
    const senderNameCol = columns.find(col => ['senderName', 'sender_name', 'sendername'].includes(col));
    const recipientEmailCol = columns.find(col => ['recipientEmail', 'recipient_email', 'recipientemail'].includes(col));
    const recipientNameCol = columns.find(col => ['recipientName', 'recipient_name', 'recipientname'].includes(col));
    const hasRead = columns.includes('read');
    const readAtCol = columns.find(col => ['readAt', 'read_at'].includes(col));
    const channelIdCol = columns.find(col => ['channelId', 'channel_id'].includes(col));
    const channelNameCol = columns.find(col => ['channelName', 'channel_name'].includes(col));
    const hasAttachments = columns.includes('attachments');
    const createdAtCol = columns.find(col => ['createdAt', 'created_at'].includes(col));
    const updatedAtCol = columns.find(col => ['updatedAt', 'updated_at'].includes(col));

    // Build attributes list - only include columns that exist
    const attributes = ['id', 'content'];
    if (senderEmailCol) attributes.push(senderEmailCol);
    if (senderNameCol) attributes.push(senderNameCol);
    if (recipientEmailCol) attributes.push(recipientEmailCol);
    if (recipientNameCol) attributes.push(recipientNameCol);
    if (hasRead) attributes.push('read');
    if (readAtCol) attributes.push(readAtCol);
    if (channelIdCol) attributes.push(channelIdCol);
    if (channelNameCol) attributes.push(channelNameCol);
    if (hasAttachments) attributes.push('attachments');
    if (createdAtCol) attributes.push(createdAtCol);
    if (updatedAtCol) attributes.push(updatedAtCol);

    // Build where clause using actual column names
    if (!senderEmailCol || !recipientEmailCol) {
      return res.status(500).json({ message: 'Messages table schema not compatible' });
    }
    
    const whereClause = {
      [Op.or]: [
        {
          [senderEmailCol]: senderEmail,
          [recipientEmailCol]: recipientEmail
        },
        {
          [senderEmailCol]: recipientEmail,
          [recipientEmailCol]: senderEmail
        }
      ]
    };
    
    if (channelIdCol) {
      whereClause[channelIdCol] = null; // Only direct messages
    }

    const messages = await Message.findAll({
      where: whereClause,
      order: createdAtCol ? [[createdAtCol, 'ASC']] : [['id', 'ASC']],
      attributes: attributes
    });

    // Mark messages as read (only if read column exists)
    if (hasRead && senderEmailCol && recipientEmailCol) {
      const updateData = { read: true };
      if (readAtCol) {
        updateData[readAtCol] = new Date();
      }
      await Message.update(
        updateData,
        {
          where: {
            [recipientEmailCol]: senderEmail,
            [senderEmailCol]: recipientEmail,
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
    console.log('Messages table columns:', columns);
    
    // Find actual column names (handle different naming conventions)
    const senderEmailCol = columns.find(col => ['senderEmail', 'sender_email', 'senderemail'].includes(col));
    const senderNameCol = columns.find(col => ['senderName', 'sender_name', 'sendername'].includes(col));
    const recipientEmailCol = columns.find(col => ['recipientEmail', 'recipient_email', 'recipientemail'].includes(col));
    const recipientNameCol = columns.find(col => ['recipientName', 'recipient_name', 'recipientname'].includes(col));
    const hasRead = columns.includes('read');
    const readAtCol = columns.find(col => ['readAt', 'read_at'].includes(col));
    const channelIdCol = columns.find(col => ['channelId', 'channel_id'].includes(col));
    const channelNameCol = columns.find(col => ['channelName', 'channel_name'].includes(col));
    const hasAttachments = columns.includes('attachments');
    const createdAtCol = columns.find(col => ['createdAt', 'created_at'].includes(col));
    const updatedAtCol = columns.find(col => ['updatedAt', 'updated_at'].includes(col));

    // Build attributes list - only include columns that exist
    const attributes = ['id', 'content'];
    if (senderEmailCol) attributes.push(senderEmailCol);
    if (senderNameCol) attributes.push(senderNameCol);
    if (recipientEmailCol) attributes.push(recipientEmailCol);
    if (recipientNameCol) attributes.push(recipientNameCol);
    if (hasRead) attributes.push('read');
    if (readAtCol) attributes.push(readAtCol);
    if (channelIdCol) attributes.push(channelIdCol);
    if (channelNameCol) attributes.push(channelNameCol);
    if (hasAttachments) attributes.push('attachments');
    if (createdAtCol) attributes.push(createdAtCol);
    if (updatedAtCol) attributes.push(updatedAtCol);

    // Build where clause using actual column names
    if (!senderEmailCol || !recipientEmailCol) {
      // If we can't determine required columns, return empty array
      return res.json([]);
    }
    
    const whereClause = {
      [Op.or]: [
        { [senderEmailCol]: userEmail, [recipientEmailCol]: { [Op.ne]: null } },
        { [recipientEmailCol]: userEmail, [senderEmailCol]: { [Op.ne]: null } }
      ]
    };
    
    // Only filter by channelId if the column exists
    if (channelIdCol) {
      whereClause[channelIdCol] = null; // Only direct messages
    }

    // Get all messages for this user
    const allMessages = await Message.findAll({
      where: whereClause,
      order: createdAtCol ? [[createdAtCol, 'DESC']] : [['id', 'DESC']],
      attributes: attributes
    });

    // Group by conversation partner
    const conversationMap = new Map();

    allMessages.forEach((msg) => {
      const msgData = msg.toJSON ? msg.toJSON() : msg;
      const senderEmail = msgData.senderEmail || msgData.sender_email || msgData.senderemail;
      const recipientEmail = msgData.recipientEmail || msgData.recipient_email || msgData.recipientemail;
      const senderName = msgData.senderName || msgData.sender_name || msgData.sendername;
      const recipientName = msgData.recipientName || msgData.recipient_name || msgData.recipientname;
      
      const partnerEmail = senderEmail === userEmail ? recipientEmail : senderEmail;
      const partnerName = senderEmail === userEmail ? recipientName : senderName;

      if (!partnerEmail) return;

      if (!conversationMap.has(partnerEmail)) {
        const createdAt = msgData.createdAt || msgData.created_at || new Date();
        conversationMap.set(partnerEmail, {
          email: partnerEmail,
          name: partnerName || partnerEmail.split('@')[0],
          lastMessage: msgData.content || '',
          lastMessageTime: createdAt,
          unread: 0
        });
      } else {
        const existing = conversationMap.get(partnerEmail);
        const createdAt = msgData.createdAt || msgData.created_at || new Date();
        // Update if this message is more recent
        if (new Date(createdAt) > new Date(existing.lastMessageTime)) {
          existing.lastMessage = msgData.content || '';
          existing.lastMessageTime = createdAt;
        }
      }
    });

    // Calculate unread counts for each conversation (only if read column exists)
    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        let unreadCount = 0;
        if (hasRead && senderEmailCol && recipientEmailCol) {
          unreadCount = await Message.count({
            where: {
              [senderEmailCol]: conv.email,
              [recipientEmailCol]: userEmail,
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

