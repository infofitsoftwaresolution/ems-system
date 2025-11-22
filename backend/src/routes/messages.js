import { Router } from "express";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { Employee } from "../models/Employee.js";
import { authenticateToken } from "../middleware/auth.js";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

const router = Router();

// Helper function to get user email from token
const getUserEmailFromToken = async (req) => {
  try {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      console.error("No user ID found in token:", req.user);
      return null;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      console.error("User not found for ID:", userId);
      return null;
    }
    return user.email;
  } catch (error) {
    console.error("Error getting user email from token:", error);
    return null;
  }
};

// Get all messages for the current user (both sent and received)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);
    if (!userEmail) {
      return res
        .status(400)
        .json({ message: "Unable to determine user email" });
    }

    // Use Sequelize ORM - field mappings in model handle column names
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderEmail: userEmail }, { recipientEmail: userEmail }],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ message: "Error fetching messages", error: error.message });
  }
});

// Get conversation between two users
router.get(
  "/conversation/:recipientEmail",
  authenticateToken,
  async (req, res) => {
    try {
      const senderEmail = await getUserEmailFromToken(req);
      if (!senderEmail) {
        return res.json([]);
      }

      const recipientEmail = decodeURIComponent(req.params.recipientEmail);

      // Use Sequelize ORM
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            {
              senderEmail: senderEmail,
              recipientEmail: recipientEmail,
            },
            {
              senderEmail: recipientEmail,
              recipientEmail: senderEmail,
            },
          ],
          channelId: null, // Only direct messages
        },
        order: [["createdAt", "ASC"]],
      });

      // Mark messages as read
      await Message.update(
        { read: true, readAt: new Date() },
        {
          where: {
            recipientEmail: senderEmail,
            senderEmail: recipientEmail,
            read: false,
          },
        }
      );

      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.json([]);
    }
  }
);

// Get all conversations for the current user
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);
    if (!userEmail) {
      return res
        .status(400)
        .json({ message: "Unable to determine user email" });
    }

    // Get all messages for this user
    const allMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderEmail: userEmail, recipientEmail: { [Op.ne]: null } },
          { recipientEmail: userEmail, senderEmail: { [Op.ne]: null } },
        ],
        channelId: null, // Only direct messages
      },
      order: [["createdAt", "DESC"]],
    });

    // Group by conversation partner
    const conversationMap = new Map();

    allMessages.forEach((msg) => {
      const partnerEmail =
        msg.senderEmail === userEmail ? msg.recipientEmail : msg.senderEmail;
      const partnerName =
        msg.senderEmail === userEmail ? msg.recipientName : msg.senderName;

      if (!partnerEmail) return;

      if (!conversationMap.has(partnerEmail)) {
        conversationMap.set(partnerEmail, {
          email: partnerEmail,
          name: partnerName || partnerEmail.split("@")[0],
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unread: 0,
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
            read: false,
          },
        });

        return {
          ...conv,
          unread: unreadCount,
        };
      })
    );

    // Sort by last message time
    conversations.sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.json([]);
  }
});

// Send a message
router.post("/", authenticateToken, async (req, res) => {
  console.log("📨 POST /api/messages - Request received");
  console.log("Request body:", {
    recipientEmail: req.body?.recipientEmail,
    content: req.body?.content
      ? `${req.body.content.substring(0, 50)}...`
      : null,
    channelId: req.body?.channelId,
    channelName: req.body?.channelName,
  });

  try {
    const { recipientEmail, content, channelId, channelName } = req.body || {};

    const senderEmail = await getUserEmailFromToken(req);
    if (!senderEmail) {
      return res
        .status(400)
        .json({ message: "Unable to determine sender email" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Get sender info
    let senderName = "Unknown User";
    try {
      const sender = await User.findOne({ where: { email: senderEmail } });
      if (sender) {
        senderName = sender.name || senderName;
      } else {
        const employee = await Employee.findOne({
          where: { email: senderEmail },
        });
        if (employee) {
          senderName = employee.name || senderName;
        }
      }
    } catch (error) {
      console.error("Error getting sender info:", error);
    }

    let recipientName = null;
    if (recipientEmail) {
      try {
        const recipient = await User.findOne({
          where: { email: recipientEmail },
        });
        if (recipient) {
          recipientName = recipient.name;
        } else {
          const employee = await Employee.findOne({
            where: { email: recipientEmail },
          });
          if (employee) {
            recipientName = employee.name;
          }
        }
      } catch (error) {
        console.error("Error getting recipient info:", error);
      }
    }

    // Ensure required columns exist before creating message
    try {
      const dialect = sequelize.getDialect();
      if (dialect === "postgres") {
        // Check and add missing columns
        const [columns] = await sequelize.query(
          `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'messages'
        `,
          { type: QueryTypes.SELECT }
        );

        const columnNames = columns.map((c) => c.column_name.toLowerCase());

        // Add sender_email if missing
        if (!columnNames.includes("sender_email")) {
          console.log("➕ Adding missing column: sender_email");
          await sequelize.query(
            `
            ALTER TABLE messages 
            ADD COLUMN sender_email VARCHAR(255) NOT NULL DEFAULT '';
          `,
            { type: QueryTypes.RAW }
          );
        }

        // Add sender_name if missing
        if (!columnNames.includes("sender_name")) {
          console.log("➕ Adding missing column: sender_name");
          await sequelize.query(
            `
            ALTER TABLE messages 
            ADD COLUMN sender_name VARCHAR(255) NOT NULL DEFAULT '';
          `,
            { type: QueryTypes.RAW }
          );
        }

        // Add content if missing (or rename user_message to content)
        if (!columnNames.includes("content")) {
          if (columnNames.includes("user_message")) {
            console.log("🔄 Renaming user_message to content");
            try {
              await sequelize.query(
                `
                ALTER TABLE messages 
                RENAME COLUMN user_message TO content;
              `,
                { type: QueryTypes.RAW }
              );
            } catch (renameError) {
              console.error(
                "Failed to rename user_message, adding content column:",
                renameError.message
              );
              await sequelize.query(
                `
                ALTER TABLE messages 
                ADD COLUMN content TEXT NOT NULL DEFAULT '';
              `,
                { type: QueryTypes.RAW }
              );
            }
          } else {
            console.log("➕ Adding missing column: content");
            await sequelize.query(
              `
              ALTER TABLE messages 
              ADD COLUMN content TEXT NOT NULL DEFAULT '';
            `,
              { type: QueryTypes.RAW }
            );
          }
        }

        // Ensure ai_response column allows NULL or has default value
        if (columnNames.includes("ai_response")) {
          try {
            // Try to alter column to allow NULL if it doesn't already
            await sequelize.query(
              `
              ALTER TABLE messages 
              ALTER COLUMN ai_response DROP NOT NULL;
            `,
              { type: QueryTypes.RAW }
            );
            console.log("✅ Updated ai_response to allow NULL");
          } catch (alterError) {
            // Column might already allow NULL, or we can't alter it
            // Try to set a default value instead
            try {
              await sequelize.query(
                `
                ALTER TABLE messages 
                ALTER COLUMN ai_response SET DEFAULT '';
              `,
                { type: QueryTypes.RAW }
              );
              console.log("✅ Set default value for ai_response");
            } catch (defaultError) {
              console.log(
                "⚠️  Could not modify ai_response column (may already be configured)"
              );
            }
          }
        }
      }
    } catch (columnError) {
      console.error("Error ensuring columns exist:", columnError.message);
      // Continue anyway - might already exist
    }

    // Use Sequelize ORM to create message - field mappings handle column names
    let message;
    try {
      message = await Message.create({
        senderEmail: senderEmail,
        senderName: senderName,
        recipientEmail: recipientEmail || null,
        recipientName: recipientName,
        channelId: channelId || null,
        channelName: channelName || null,
        content: content.trim(),
        aiResponse: "", // Always provide ai_response with empty string default
        read: false,
      });
    } catch (createError) {
      console.error("==========================================");
      console.error("❌ Database error creating message:");
      console.error("Error name:", createError.name);
      console.error("Error message:", createError.message);
      if (createError.original) {
        console.error("Original error:", createError.original.message);
        console.error("Original code:", createError.original.code);
        console.error("Original detail:", createError.original.detail);
        console.error("Original hint:", createError.original.hint);
      }
      if (createError.sql) {
        console.error("SQL:", createError.sql);
      }
      console.error("Attempted data:", {
        senderEmail,
        senderName,
        recipientEmail,
        recipientName,
        channelId,
        channelName,
        content: content.substring(0, 50),
      });
      console.error("==========================================");
      throw createError;
    }

    console.log("✅ Message created successfully:", {
      id: message.id,
      senderEmail: message.senderEmail,
      recipientEmail: message.recipientEmail,
      channelId: message.channelId,
    });

    // Create notification for recipient (direct message) or channel members
    try {
      if (recipientEmail && !channelId) {
        // Direct message - create notification for recipient
        const recipient = await User.findOne({
          where: { email: recipientEmail },
        });
        if (recipient) {
          // Truncate message for notification
          const messagePreview =
            content.length > 50 ? content.substring(0, 50) + "..." : content;

          const notification = await Notification.create({
            userId: recipient.id,
            userEmail: recipientEmail,
            title: `New message from ${senderName}`,
            message: messagePreview,
            type: "info",
            link: `/communication?conversation=${encodeURIComponent(
              senderEmail
            )}`,
            isRead: false,
          });

          console.log(
            `✅ Notification created for recipient: ${recipientEmail}`
          );

          // Emit notification via Socket.io for real-time update
          try {
            const io = req.app.get("io");
            if (io) {
              io.emit("new-notification", {
                userId: recipient.id,
                notification: notification,
              });
            }
          } catch (socketError) {
            console.error(
              "Error emitting notification socket event:",
              socketError
            );
          }
        }
      } else if (channelId) {
        // Channel message - create notifications for all channel members except sender
        const sender = await User.findOne({ where: { email: senderEmail } });
        if (sender) {
          const senderEmployee = await Employee.findOne({
            where: { email: senderEmail },
          });
          const department = senderEmployee?.department || channelId;

          // Get all employees in the same department
          const departmentEmployees = await Employee.findAll({
            where: { department: department },
          });

          // Get all users for these employees (excluding sender)
          const departmentEmails = departmentEmployees
            .map((emp) => emp.email)
            .filter((email) => email !== senderEmail);

          if (departmentEmails.length > 0) {
            const departmentUsers = await User.findAll({
              where: {
                email: { [Op.in]: departmentEmails },
              },
            });

            // Create notification for each department member
            const messagePreview =
              content.length > 50 ? content.substring(0, 50) + "..." : content;

            const io = req.app.get("io");

            for (const user of departmentUsers) {
              const notification = await Notification.create({
                userId: user.id,
                userEmail: user.email,
                title: `New message in ${channelName || department}`,
                message: `${senderName}: ${messagePreview}`,
                type: "info",
                link: `/communication?channel=${encodeURIComponent(channelId)}`,
                isRead: false,
              });

              // Emit notification via Socket.io for real-time update
              try {
                if (io) {
                  io.emit("new-notification", {
                    userId: user.id,
                    notification: notification,
                  });
                }
              } catch (socketError) {
                console.error(
                  "Error emitting notification socket event:",
                  socketError
                );
              }
            }

            console.log(
              `✅ Notifications created for ${departmentUsers.length} channel members`
            );
          }
        }
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't fail the message creation if notification fails
    }

    // Emit real-time event via Socket.io
    try {
      const io = req.app.get("io");
      if (io) {
        if (channelId) {
          io.emit("new-channel-message", {
            channelId: channelId,
            message: message,
          });
        } else if (recipientEmail) {
          io.emit("new-direct-message", {
            message: message,
            recipientEmail: recipientEmail,
            senderEmail: senderEmail,
          });
        }
      }
    } catch (socketError) {
      console.error("Error emitting socket event:", socketError);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("==========================================");
    console.error("❌ Error sending message (catch-all):");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.original) {
      console.error("Original error message:", error.original.message);
      console.error("Original error code:", error.original.code);
      console.error("Original error detail:", error.original.detail);
      console.error("Original error hint:", error.original.hint);
    }

    if (error.sql) {
      console.error("SQL query:", error.sql);
    }

    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }

    console.error("Request body:", req.body);
    console.error("Request user:", req.user);
    console.error("==========================================");

    if (!res.headersSent) {
      // Provide helpful error message based on error type
      let errorMessage = "Error sending message";
      let errorDetails =
        error.message || error.original?.message || "Unknown error";

      // Check for common database errors
      if (
        error.original?.code === "42703" ||
        error.message?.includes("column") ||
        error.message?.includes("does not exist")
      ) {
        errorMessage = "Database schema error: Missing required columns";
        errorDetails =
          "The messages table is missing required columns. Please run the migration to add sender_email, sender_name, and content columns.";
      } else if (
        error.original?.code === "23502" ||
        error.message?.includes("null value")
      ) {
        errorMessage = "Database constraint error: Required field is null";
        errorDetails = error.original?.message || error.message;
      }

      res.status(500).json({
        message: errorMessage,
        error: errorDetails,
        details:
          process.env.NODE_ENV === "development"
            ? {
                name: error.name,
                original: error.original?.message,
                code: error.original?.code,
                sql: error.sql,
                stack: error.stack,
              }
            : undefined,
      });
    }
  }
});

// Mark messages as read
router.put("/read", authenticateToken, async (req, res) => {
  try {
    const { senderEmail } = req.body;
    const recipientEmail = await getUserEmailFromToken(req);

    if (!senderEmail || !recipientEmail) {
      return res.json({ success: true, message: "Messages marked as read" });
    }

    await Message.update(
      { read: true, readAt: new Date() },
      {
        where: {
          senderEmail: senderEmail,
          recipientEmail: recipientEmail,
          read: false,
        },
      }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    if (!res.headersSent) {
      res.json({ success: true, message: "Messages marked as read" });
    }
  }
});

// Get unread message count
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);
    if (!userEmail) {
      return res.json({ count: 0 });
    }

    const count = await Message.count({
      where: {
        recipientEmail: userEmail,
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.json({ count: 0 });
  }
});

// Get channels (departments) for the current user
router.get("/channels", authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);
    const user = await User.findOne({ where: { email: userEmail } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const employee = await Employee.findOne({ where: { email: userEmail } });
    const userDepartment = employee?.department;

    const allDepartments = await Employee.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("department")), "department"],
      ],
      where: {
        department: { [Op.ne]: null },
      },
      raw: true,
    });

    const channels = await Promise.all(
      allDepartments.map(async (dept) => {
        const department = dept.department;

        const canAccess =
          user.role === "admin" ||
          user.role === "hr" ||
          (user.role === "employee" && department === userDepartment);

        if (!canAccess) return null;

        // Get last message for this channel
        const lastMessage = await Message.findOne({
          where: { channelId: department },
          order: [["createdAt", "DESC"]],
        });

        // Get unread count
        const unreadCount = await Message.count({
          where: {
            channelId: department,
            read: false,
            senderEmail: { [Op.ne]: userEmail },
          },
        });

        return {
          id: department,
          name: department,
          description: `${department} department channel`,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: lastMessage?.createdAt || new Date(),
          unread: unreadCount,
        };
      })
    );

    res.json(channels.filter((ch) => ch !== null));
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({
      message: "Error fetching channels",
      error: error.message,
    });
  }
});

// Get messages for a channel
router.get("/channel/:channelId", authenticateToken, async (req, res) => {
  try {
    const userEmail = await getUserEmailFromToken(req);
    const channelId = decodeURIComponent(req.params.channelId);

    const user = await User.findOne({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const employee = await Employee.findOne({ where: { email: userEmail } });
    const userDepartment = employee?.department;

    const canAccess =
      user.role === "admin" ||
      user.role === "hr" ||
      (user.role === "employee" && channelId === userDepartment);

    if (!canAccess) {
      return res.status(403).json({ message: "Access denied to this channel" });
    }

    const messages = await Message.findAll({
      where: { channelId: channelId },
      order: [["createdAt", "ASC"]],
    });

    // Mark messages as read
    await Message.update(
      { read: true, readAt: new Date() },
      {
        where: {
          channelId: channelId,
          read: false,
          senderEmail: { [Op.ne]: userEmail },
        },
      }
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching channel messages:", error);
    res.status(500).json({
      message: "Error fetching channel messages",
      error: error.message,
    });
  }
});

export default router;
