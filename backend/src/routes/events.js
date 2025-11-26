import { Router } from "express";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { Employee } from "../models/Employee.js";
import { Notification } from "../models/Notification.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { Op } from "sequelize";
import { getIO } from "../server.js";

const router = Router();

// Helper function to send notifications for events
async function sendEventNotifications(event, isUpdate = false) {
  try {
    let targetUserIds = [];

    if (event.visibility_type === "ALL") {
      // Get all employee user IDs from User table
      const employeeUsers = await User.findAll({
        where: { role: "employee" },
        attributes: ["id", "email"],
      });
      targetUserIds = employeeUsers.map((u) => u.id);

      // Also try to get user IDs from Employee table by email
      const employeeEmails = employeeUsers.map((u) => u.email);
      if (employeeEmails.length > 0) {
        const employees = await Employee.findAll({
          where: { email: { [Op.in]: employeeEmails } },
          attributes: ["id", "email"],
        });

        // Try to match employees with users by email
        employees.forEach((emp) => {
          const user = employeeUsers.find((u) => u.email === emp.email);
          if (user && !targetUserIds.includes(user.id)) {
            targetUserIds.push(user.id);
          }
        });
      }
    } else if (event.visibility_type === "SPECIFIC" && event.assigned_users) {
      // Get user IDs from assigned employee IDs
      const assignedEmployeeIds = Array.isArray(event.assigned_users)
        ? event.assigned_users
        : JSON.parse(event.assigned_users || "[]");

      if (assignedEmployeeIds.length > 0) {
        // First, try to get employees by ID
        const employees = await Employee.findAll({
          where: { id: { [Op.in]: assignedEmployeeIds } },
          attributes: ["id", "email"],
        });

        // Get user IDs by matching employee emails
        const employeeEmails = employees.map((emp) => emp.email);
        if (employeeEmails.length > 0) {
          const users = await User.findAll({
            where: { email: { [Op.in]: employeeEmails } },
            attributes: ["id"],
          });
          targetUserIds = users.map((u) => u.id);
        }

        // Also try to get users directly if employee ID matches user ID
        const directUsers = await User.findAll({
          where: { id: { [Op.in]: assignedEmployeeIds } },
          attributes: ["id"],
        });
        const directUserIds = directUsers.map((u) => u.id);
        targetUserIds = [...new Set([...targetUserIds, ...directUserIds])];
      }
    }

    if (targetUserIds.length === 0) {
      console.log("⚠️ No target users found for event notification");
      return;
    }

    // Format start date/time for notification message
    const formatDateTime = (date) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Create notifications for all target users
    const notifications = await Promise.all(
      targetUserIds.map(async (userId) => {
        // Get user email for notification
        const user = await User.findByPk(userId, { attributes: ["email"] });
        const userEmail = user?.email || "";

        // Format notification message as per requirements
        const notificationMessage = isUpdate
          ? `Event Updated: ${event.title} on ${formatDateTime(event.start_date_time)}`
          : `New Event Assigned: ${event.title} on ${formatDateTime(event.start_date_time)}`;

        return Notification.create({
          userId: userId,
          userEmail: userEmail,
          eventId: event.id, // Link notification to event
          title: isUpdate ? "Event Updated" : "New Event Assigned",
          message: notificationMessage,
          type: "info", // Use standard notification type
          link: `/calendar?event=${event.id}`, // Link to calendar event
          metadata: JSON.stringify({
            eventId: event.id,
            eventTitle: event.title,
            startDate: event.start_date_time,
            endDate: event.end_date_time,
          }),
          isRead: false,
        });
      })
    );

    // Emit Socket.IO event to notify clients in real-time
    const io = getIO();
    if (io) {
      targetUserIds.forEach((userId) => {
        io.to(`user_${userId}`).emit("new_notification", {
          type: "event",
          title: isUpdate ? "Event Updated" : "New Event",
          message: `${event.title}${isUpdate ? " has been updated" : ""}`,
        });
        io.to(`user_${userId}`).emit("event_created", {
          eventId: event.id,
          event: event.toJSON(),
        });
      });
    }

    // Mark notification as sent
    await event.update({ notification_sent: true });

    console.log(
      `✅ Sent ${notifications.length} notifications for event: ${event.title}`
    );
  } catch (error) {
    console.error("Error sending event notifications:", error);
  }
}

// Get all events (filtered by user role and visibility)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { start, end } = req.query; // Optional date range filter

    let whereClause = {};

    // If date range is provided, filter events
    if (start && end) {
      whereClause[Op.or] = [
        {
          start_date_time: {
            [Op.between]: [new Date(start), new Date(end)],
          },
        },
        {
          end_date_time: {
            [Op.between]: [new Date(start), new Date(end)],
          },
        },
        {
          [Op.and]: [
            { start_date_time: { [Op.lte]: new Date(start) } },
            { end_date_time: { [Op.gte]: new Date(end) } },
          ],
        },
      ];
    }

    // Employees can only see:
    // 1. Events with visibility_type = "ALL"
    // 2. Events with visibility_type = "SPECIFIC" where they are in assigned_users
    if (user.role === "employee") {
      // Get employee ID from user
      const employee = await Employee.findOne({
        where: { email: user.email },
        attributes: ["id"],
      });
      const employeeId = employee?.id || userId; // Fallback to userId if no employee record

      whereClause[Op.or] = [
        { visibility_type: "ALL" },
        {
          [Op.and]: [
            { visibility_type: "SPECIFIC" },
            {
              assigned_users: {
                [Op.like]: `%${employeeId}%`,
              },
            },
          ],
        },
      ];
    }
    // Admin, HR, Manager can see all events

    const events = await Event.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["start_date_time", "ASC"]],
    });

    // Transform events for frontend
    const transformedEvents = events.map((event) => {
      const eventData = event.toJSON();
      return {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || "",
        start: eventData.start_date_time,
        end: eventData.end_date_time,
        created_by: eventData.created_by,
        creator: eventData.creator
          ? {
              id: eventData.creator.id,
              name: eventData.creator.name,
              email: eventData.creator.email,
            }
          : null,
        visibility_type: eventData.visibility_type,
        assigned_users: eventData.assigned_users || [],
        notification_sent: eventData.notification_sent,
        created_at: eventData.created_at,
        updated_at: eventData.updated_at,
      };
    });

    res.json({ success: true, data: transformedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);

    // Provide more detailed error message
    let errorMessage = "Error fetching events";
    if (error.name === "SequelizeDatabaseError") {
      if (error.message.includes("does not exist")) {
        errorMessage =
          "Events table structure is incorrect. Please restart the server to run migrations.";
      } else {
        errorMessage = `Database error: ${error.message}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get event by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user?.sub || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Check if employee can view this event
    if (user.role === "employee") {
      const employee = await Employee.findOne({
        where: { email: user.email },
        attributes: ["id"],
      });
      const employeeId = employee?.id || userId;

      if (
        event.visibility_type !== "ALL" &&
        (!event.assigned_users || !event.assigned_users.includes(employeeId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this event",
        });
      }
    }

    const eventData = event.toJSON();
    res.json({
      success: true,
      data: {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || "",
        start: eventData.start_date_time,
        end: eventData.end_date_time,
        created_by: eventData.created_by,
        creator: eventData.creator
          ? {
              id: eventData.creator.id,
              name: eventData.creator.name,
              email: eventData.creator.email,
            }
          : null,
        visibility_type: eventData.visibility_type,
        assigned_users: eventData.assigned_users || [],
        notification_sent: eventData.notification_sent,
        created_at: eventData.created_at,
        updated_at: eventData.updated_at,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching event",
      error: error.message,
    });
  }
});

// Create new event (Admin/HR only)
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "hr"]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        start_date_time,
        end_date_time,
        visibility_type,
        assigned_users,
      } = req.body;

      const userId = req.user?.sub || req.user?.id;

      // Validation
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Event title is required",
        });
      }

      if (!start_date_time || !end_date_time) {
        return res.status(400).json({
          success: false,
          message: "Start date/time and end date/time are required",
        });
      }

      const startDate = new Date(start_date_time);
      const endDate = new Date(end_date_time);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: "End date/time must be after start date/time",
        });
      }

      if (!["ALL", "SPECIFIC"].includes(visibility_type)) {
        return res.status(400).json({
          success: false,
          message: "Visibility type must be 'ALL' or 'SPECIFIC'",
        });
      }

      if (visibility_type === "SPECIFIC") {
        if (
          !assigned_users ||
          !Array.isArray(assigned_users) ||
          assigned_users.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Assigned users are required when visibility type is 'SPECIFIC'",
          });
        }
      }

      // Prepare assigned_users - handle null case properly
      let assignedUsersValue = null;
      if (
        visibility_type === "SPECIFIC" &&
        assigned_users &&
        Array.isArray(assigned_users) &&
        assigned_users.length > 0
      ) {
        assignedUsersValue = assigned_users;
      }

      // Create event
      console.log("Creating event with data:", {
        title: title.trim(),
        description: description?.trim() || null,
        start_date_time: startDate,
        end_date_time: endDate,
        created_by: userId,
        visibility_type: visibility_type,
        assigned_users: assignedUsersValue,
        notification_sent: false,
      });

      const createEventData = {
        title: title.trim(),
        description: description?.trim() || null,
        start_date_time: startDate,
        end_date_time: endDate,
        created_by: userId,
        visibility_type: visibility_type,
        notification_sent: false,
      };

      // Only set assigned_users if it's not null (model setter will handle JSON.stringify)
      if (assignedUsersValue !== null) {
        createEventData.assigned_users = assignedUsersValue;
      }

      const event = await Event.create(createEventData);

      console.log("Event created successfully:", event.toJSON());

      // Send notifications
      await sendEventNotifications(event, false);

      const responseData = event.toJSON();
      res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: {
          id: responseData.id,
          title: responseData.title,
          description: responseData.description || "",
          start: responseData.start_date_time,
          end: responseData.end_date_time,
          created_by: responseData.created_by,
          visibility_type: responseData.visibility_type,
          assigned_users: responseData.assigned_users || [],
          notification_sent: responseData.notification_sent,
          created_at: responseData.created_at,
          updated_at: responseData.updated_at,
        },
      });
    } catch (error) {
      console.error("Error creating event:", error);
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
      console.error("Request body:", req.body);
      console.error("User ID:", req.user?.sub || req.user?.id);

      // Provide more detailed error message
      let errorMessage = "Error creating event";
      if (error.name === "SequelizeValidationError") {
        errorMessage = `Validation error: ${error.errors
          .map((e) => e.message)
          .join(", ")}`;
      } else if (error.name === "SequelizeDatabaseError") {
        errorMessage = `Database error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Update event (Admin/HR only)
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin", "hr"]),
  async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const {
        title,
        description,
        start_date_time,
        end_date_time,
        visibility_type,
        assigned_users,
      } = req.body;

      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Validation
      if (title !== undefined && (!title || !title.trim())) {
        return res.status(400).json({
          success: false,
          message: "Event title cannot be empty",
        });
      }

      if (start_date_time && end_date_time) {
        const startDate = new Date(start_date_time);
        const endDate = new Date(end_date_time);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format",
          });
        }

        if (endDate <= startDate) {
          return res.status(400).json({
            success: false,
            message: "End date/time must be after start date/time",
          });
        }
      }

      if (visibility_type && !["ALL", "SPECIFIC"].includes(visibility_type)) {
        return res.status(400).json({
          success: false,
          message: "Visibility type must be 'ALL' or 'SPECIFIC'",
        });
      }

      // Update event
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined)
        updateData.description = description?.trim() || null;
      if (start_date_time !== undefined)
        updateData.start_date_time = new Date(start_date_time);
      if (end_date_time !== undefined)
        updateData.end_date_time = new Date(end_date_time);
      if (visibility_type !== undefined)
        updateData.visibility_type = visibility_type;
      if (assigned_users !== undefined) {
        updateData.assigned_users =
          visibility_type === "SPECIFIC" ? assigned_users : null;
      }
      updateData.notification_sent = false; // Reset notification flag

      await event.update(updateData);

      // Send notifications for update
      await sendEventNotifications(event, true);

      const eventData = event.toJSON();
      res.json({
        success: true,
        message: "Event updated successfully",
        data: {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description || "",
          start: eventData.start_date_time,
          end: eventData.end_date_time,
          created_by: eventData.created_by,
          visibility_type: eventData.visibility_type,
          assigned_users: eventData.assigned_users || [],
          notification_sent: eventData.notification_sent,
          created_at: eventData.created_at,
          updated_at: eventData.updated_at,
        },
      });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({
        success: false,
        message: "Error updating event",
        error: error.message,
      });
    }
  }
);

// Get employee-specific event feed (upcoming events for the logged-in employee)
router.get("/feed/my-events", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Get employee ID from user
    const employee = await Employee.findOne({
      where: { email: user.email },
      attributes: ["id"],
    });
    const employeeId = employee?.id || userId; // Fallback to userId if no employee record

    // Build where clause for employee-specific events
    const whereClause = {
      [Op.or]: [
        { visibility_type: "ALL" },
        {
          [Op.and]: [
            { visibility_type: "SPECIFIC" },
            {
              assigned_users: {
                [Op.like]: `%${employeeId}%`,
              },
            },
          ],
        },
      ],
      // Only get upcoming events
      start_date_time: {
        [Op.gte]: new Date(),
      },
    };

    const events = await Event.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["start_date_time", "ASC"]],
      limit: 10, // Limit to 10 upcoming events
    });

    // Transform events for frontend
    const transformedEvents = events.map((event) => {
      const eventData = event.toJSON();
      return {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || "",
        start: eventData.start_date_time,
        end: eventData.end_date_time,
        created_by: eventData.created_by,
        creator: eventData.creator
          ? {
              id: eventData.creator.id,
              name: eventData.creator.name,
              email: eventData.creator.email,
            }
          : null,
        visibility_type: eventData.visibility_type,
        assigned_users: eventData.assigned_users || [],
        created_at: eventData.created_at,
        updated_at: eventData.updated_at,
      };
    });

    res.json({ success: true, data: transformedEvents });
  } catch (error) {
    console.error("Error fetching employee event feed:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee event feed",
      error: error.message,
    });
  }
});

// Delete event (Admin/HR only)
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin", "hr"]),
  async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);

      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      await event.destroy();

      res.json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting event",
        error: error.message,
      });
    }
  }
);

export default router;
