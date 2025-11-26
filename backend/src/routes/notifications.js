import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import { Op } from "sequelize";

const router = Router();

// Helper function to get user ID and email from token
const getUserFromToken = async (req) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      return null;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
};

// Get all notifications for the current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { limit = 50, offset = 0, unreadOnly = false, eventId, taskId } = req.query;

    const whereClause = {
      userId: user.id,
    };

    if (unreadOnly === "true") {
      whereClause.isRead = false;
    }

    // Filter by event_id if provided
    if (eventId) {
      whereClause.eventId = parseInt(eventId);
    }

    // Filter by task_id if provided
    if (taskId) {
      whereClause.taskId = parseInt(taskId);
    }

    // Order by: unread first, then by creation date (newest first)
    const notifications = await Notification.findAll({
      where: whereClause,
      order: [
        ["isRead", "ASC"], // Unread (false) first
        ["createdAt", "DESC"], // Then newest first
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message,
    });
  }
});

// Get unread notification count
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const count = await Notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      message: "Error fetching unread count",
      error: error.message,
    });
  }
});

// Mark a notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      message: "Error marking notification as read",
      error: error.message,
    });
  }
});

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const updated = await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          userId: user.id,
          isRead: false,
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      count: updated[0],
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
});

// Create a notification (for admin/system use)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user has permission to create notifications (admin, hr, or system)
    if (user.role !== "admin" && user.role !== "hr") {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const {
      userId,
      userEmail,
      title,
      message,
      type = "info",
      link,
      metadata,
    } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }

    // If userId is provided, use it; otherwise use the current user
    const targetUserId = userId || user.id;
    const targetUserEmail = userEmail || user.email;

    const notification = await Notification.create({
      userId: targetUserId,
      userEmail: targetUserEmail,
      title,
      message,
      type,
      link: link || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      isRead: false,
    });

    // Emit real-time notification via Socket.io
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("new-notification", {
          userId: targetUserId,
          notification: notification,
        });
      }
    } catch (socketError) {
      console.error("Error emitting socket event:", socketError);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      message: "Error creating notification",
      error: error.message,
    });
  }
});

export default router;
