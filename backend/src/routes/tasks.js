import { Router } from 'express';
import { Task } from '../models/Task.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';
import { getIO } from '../server.js';

const router = Router();

// Helper function to send notifications for tasks
async function sendTaskNotifications(task, isUpdate = false) {
  try {
    let targetUserIds = [];

    if (task.visibility_type === "ALL") {
      // Get all ACTIVE employee user IDs from User table
      const employeeUsers = await User.findAll({
        where: { role: "employee", active: true },
        attributes: ["id", "email"],
      });
      
      // Filter to only include active employees who can access system
      const employeeEmails = employeeUsers.map((u) => u.email);
      const activeEmployees = await Employee.findAll({
        where: { 
          email: { [Op.in]: employeeEmails },
          is_active: true, // Only active employees
          can_access_system: true // Only employees who can access system
        },
        attributes: ["id", "email", "is_active", "can_access_system"],
      });
      
      // Map active employees with system access to user IDs
      targetUserIds = employeeUsers
        .filter((user) => {
          const employee = activeEmployees.find((emp) => emp.email === user.email);
          return employee && employee.is_active && employee.can_access_system;
        })
        .map((u) => u.id);
    } else if (task.visibility_type === "SPECIFIC" && task.assigned_users) {
      // Get user IDs from assigned employee IDs (only active employees)
      const assignedEmployeeIds = Array.isArray(task.assigned_users)
        ? task.assigned_users
        : JSON.parse(task.assigned_users || "[]");

      if (assignedEmployeeIds.length > 0) {
        // First, try to get ACTIVE employees with system access by ID
        const employees = await Employee.findAll({
          where: { 
            id: { [Op.in]: assignedEmployeeIds },
            is_active: true, // Only active employees
            can_access_system: true // Only employees who can access system
          },
          attributes: ["id", "email", "is_active", "can_access_system"],
        });

        // Get user IDs by matching employee emails (only for active employees)
        const employeeEmails = employees.map((emp) => emp.email);
        if (employeeEmails.length > 0) {
          const users = await User.findAll({
            where: { 
              email: { [Op.in]: employeeEmails },
              active: true // Only active users
            },
            attributes: ["id"],
          });
          targetUserIds = users.map((u) => u.id);
        }

        // Also try to get users directly if employee ID matches user ID (only active)
        const directUsers = await User.findAll({
          where: { 
            id: { [Op.in]: assignedEmployeeIds },
            active: true // Only active users
          },
          attributes: ["id"],
        });
        const directUserIds = directUsers.map((u) => u.id);
        targetUserIds = [...new Set([...targetUserIds, ...directUserIds])];
      }
    }

    if (targetUserIds.length === 0) {
      console.log("⚠️ No target users found for task notification");
      return;
    }

    // Format due date for notification message
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

    // Create notifications for all target users (only active employees)
    const notifications = await Promise.all(
      targetUserIds.map(async (userId) => {
        // Get user email and check if user/employee is active
        const user = await User.findByPk(userId, { attributes: ["id", "email", "active"] });
        if (!user || !user.active) {
          console.log(`⏭️ Skipping notification for inactive user: ${userId}`);
          return null; // Skip inactive users
        }
        
        // Double-check employee is active and can access system
        const employee = await Employee.findOne({
          where: { email: user.email },
          attributes: ["id", "is_active", "can_access_system"],
        });
        
        if (employee && (!employee.is_active || !employee.can_access_system)) {
          const reason = !employee.is_active ? 'inactive' : 'cannot access system';
          console.log(`⏭️ Skipping notification for employee ${user.email}: ${reason}`);
          return null; // Skip inactive employees or those without system access
        }
        
        const userEmail = user.email || "";

        // Format notification message as per requirements
        const dueDateStr = task.dueDate ? formatDateTime(task.dueDate) : "No deadline";
        const notificationMessage = isUpdate
          ? `Task Updated: ${task.title}${task.dueDate ? ` (Due: ${dueDateStr})` : ""}`
          : `New Task Assigned: ${task.title}${task.dueDate ? ` (Due: ${dueDateStr})` : ""}`;

        return Notification.create({
          userId: userId,
          userEmail: userEmail,
          taskId: task.id, // Link notification to task
          title: isUpdate ? "Task Updated" : "New Task Assigned",
          message: notificationMessage,
          type: "info", // Use standard notification type
          link: `/tasks?task=${task.id}`, // Link to tasks page
          metadata: JSON.stringify({
            taskId: task.id,
            taskTitle: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
          }),
          isRead: false,
        });
      })
    );
    
    // Filter out null values (inactive employees)
    const validNotifications = notifications.filter(n => n !== null);

    // Emit Socket.IO event to notify clients in real-time (only for active employees)
    const io = getIO();
    if (io) {
      // Only emit to users who received notifications (active employees)
      const activeUserIds = validNotifications.map(n => n.userId);
      activeUserIds.forEach((userId) => {
        io.to(`user_${userId}`).emit("new_notification", {
          type: "task",
          title: isUpdate ? "Task Updated" : "New Task Assigned",
          message: isUpdate
            ? `Task Updated: ${task.title}`
            : `New Task Assigned: ${task.title}`,
        });
        io.to(`user_${userId}`).emit("task_created", {
          taskId: task.id,
          task: task.toJSON(),
        });
      });
    }

    // Mark notification as sent
    await task.update({ notification_sent: true });

    console.log(
      `✅ Sent ${validNotifications.length} notifications for task: ${task.title} (skipped ${notifications.length - validNotifications.length} inactive employees)`
    );
  } catch (error) {
    console.error("Error sending task notifications:", error);
  }
}

// Get all tasks (filtered by user role and visibility)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { status, priority, assigneeId } = req.query;
    
    let whereClause = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }
    
    if (assigneeId && assigneeId !== 'all') {
      whereClause.assigneeId = assigneeId;
    }

    // Employees can only see:
    // 1. Tasks with visibility_type = "ALL"
    // 2. Tasks with visibility_type = "SPECIFIC" where they are in assigned_users
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
    // Admin, HR, Manager can see all tasks

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']] // Sort by due date, then creation date
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tasks',
      error: error.message 
    });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ 
      message: 'Error fetching task',
      error: error.message 
    });
  }
});

// Create new task (Admin/HR only)
router.post(
  '/',
  authenticateToken,
  requireRole(["admin", "hr"]),
  async (req, res) => {
  try {
      const {
        title,
        description,
        status,
        priority,
        assigneeId,
        dueDate,
        visibility_type,
        assigned_users,
      } = req.body;
      
      const userId = req.user?.sub || req.user?.id;
    const userEmail = req.user?.email || req.body.createdBy;

      // Validation
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title is required",
        });
      }

      if (!["ALL", "SPECIFIC"].includes(visibility_type || "ALL")) {
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

      // Legacy: If assigneeId is provided, get employee details (for backward compatibility)
    let assigneeEmail = null;
    let assigneeName = null;
    
    if (assigneeId) {
      const employee = await Employee.findOne({
        where: { employeeId: String(assigneeId) }
      });
      
      if (employee) {
        assigneeEmail = employee.email;
        assigneeName = employee.name;
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || null,
      status: status || 'todo',
      priority: priority || 'medium',
        assigneeId: assigneeId || null, // Legacy field
      assigneeEmail: assigneeEmail,
      assigneeName: assigneeName,
        createdBy: userEmail, // Legacy field
        created_by: userId, // New field
        visibility_type: visibility_type || "ALL",
        assigned_users: assignedUsersValue,
        notification_sent: false,
      dueDate: dueDate ? new Date(dueDate) : null
    });

      // Send notifications
      await sendTaskNotifications(task, false);

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error creating task',
        error: error.message 
      });
    }
  }
);

// Get employee-specific task feed (upcoming tasks for the logged-in employee)
router.get('/feed/my-tasks', authenticateToken, async (req, res) => {
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

    // Build where clause for employee-specific tasks
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
      // Only get pending/in-progress tasks (not completed)
      status: {
        [Op.in]: ["todo", "in-progress", "review"],
      },
    };

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['dueDate', 'ASC'], ['priority', 'DESC'], ['createdAt', 'DESC']],
      limit: 10, // Limit to 10 upcoming tasks
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching employee task feed:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee task feed",
      error: error.message,
    });
  }
});

// Mark task as complete (Employee can mark their assigned tasks as complete)
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user?.sub || req.user?.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }

    // Check if employee can update this task
    if (user.role === "employee") {
      // Get employee ID from user
      const employee = await Employee.findOne({
        where: { email: user.email },
        attributes: ["id"],
      });
      const employeeId = employee?.id || userId;

      // Check if task is assigned to this employee
      const isAssigned = 
        task.visibility_type === "ALL" || 
        (task.visibility_type === "SPECIFIC" && 
         task.assigned_users && 
         (Array.isArray(task.assigned_users) 
           ? task.assigned_users.includes(employeeId)
           : JSON.parse(task.assigned_users || "[]").includes(employeeId)));

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update this task",
        });
      }
    }

    // Update task status to completed
    const updateData = {
      status: "completed",
      completedAt: task.status !== "completed" ? new Date() : task.completedAt,
    };

    await task.update(updateData);

    res.json({
      success: true,
      message: "Task marked as completed successfully",
      data: task,
    });
  } catch (error) {
    console.error('Error marking task as complete:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error marking task as complete',
      error: error.message 
    });
  }
});

// Update task status (Employee can update status for their assigned tasks, Admin/HR can update all fields)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.user?.sub || req.user?.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (!status || !['todo', 'in-progress', 'review', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (todo, in-progress, review, completed)",
      });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }

    // Check if employee can update this task
    if (user.role === "employee") {
      // Get employee ID from user
      const employee = await Employee.findOne({
        where: { email: user.email },
        attributes: ["id"],
      });
      const employeeId = employee?.id || userId;

      // Check if task is assigned to this employee
      const isAssigned = 
        task.visibility_type === "ALL" || 
        (task.visibility_type === "SPECIFIC" && 
         task.assigned_users && 
         (Array.isArray(task.assigned_users) 
           ? task.assigned_users.includes(employeeId)
           : JSON.parse(task.assigned_users || "[]").includes(employeeId)));

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update this task",
        });
      }
    }

    // Update completedAt if status is being changed to/from completed
    let completedAt = task.completedAt;
    if (status === 'completed' && task.status !== 'completed') {
      completedAt = new Date();
    } else if (status !== 'completed' && task.status === 'completed') {
      completedAt = null;
    }

    await task.update({
      status: status,
      completedAt: completedAt,
    });

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating task status',
      error: error.message 
    });
  }
});

// Update task (Admin/HR only - can update all fields)
router.put('/:id', authenticateToken, requireRole(["admin", "hr"]), async (req, res) => {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If assigneeId is being updated, get employee details
    let assigneeEmail = task.assigneeEmail;
    let assigneeName = task.assigneeName;
    
    if (assigneeId !== undefined && assigneeId !== task.assigneeId) {
      if (assigneeId) {
        const employee = await Employee.findOne({
          where: { employeeId: String(assigneeId) }
        });
        
        if (employee) {
          assigneeEmail = employee.email;
          assigneeName = employee.name;
        } else {
          assigneeEmail = null;
          assigneeName = null;
        }
      } else {
        assigneeEmail = null;
        assigneeName = null;
      }
    }

    // Update completedAt if status is being changed to/from completed
    let completedAt = task.completedAt;
    if (status === 'completed' && task.status !== 'completed') {
      completedAt = new Date();
    } else if (status !== 'completed' && task.status === 'completed') {
      completedAt = null;
    }

    // Handle visibility_type and assigned_users updates
    const updateData = {
      title: title !== undefined ? title.trim() : task.title,
      description: description !== undefined ? (description?.trim() || null) : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
      assigneeEmail: assigneeEmail,
      assigneeName: assigneeName,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      completedAt: completedAt,
    };

    // Update visibility fields if provided
    if (req.body.visibility_type !== undefined) {
      updateData.visibility_type = req.body.visibility_type;
      if (req.body.assigned_users !== undefined) {
        updateData.assigned_users =
          req.body.visibility_type === "SPECIFIC" ? req.body.assigned_users : null;
      }
      updateData.notification_sent = false; // Reset notification flag
    }

    await task.update(updateData);

    // Send notifications for update if visibility changed or task was updated
    if (req.body.visibility_type !== undefined || req.body.title !== undefined || req.body.dueDate !== undefined) {
      await sendTaskNotifications(task, true);
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      message: 'Error updating task',
      error: error.message 
    });
  }
});

// Delete task (Admin/HR only)
router.delete('/:id', authenticateToken, requireRole(["admin", "hr"]), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      message: 'Error deleting task',
      error: error.message 
    });
  }
});

export default router;

