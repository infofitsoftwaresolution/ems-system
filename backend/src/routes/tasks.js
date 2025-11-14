import { Router } from 'express';
import { Task } from '../models/Task.js';
import { Employee } from '../models/Employee.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
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

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
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

// Create new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    const userEmail = req.user?.email || req.body.createdBy;

    if (!title) {
      return res.status(400).json({ 
        message: 'Task title is required' 
      });
    }

    // If assigneeId is provided, get employee details
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
      assigneeId: assigneeId || null,
      assigneeEmail: assigneeEmail,
      assigneeName: assigneeName,
      createdBy: userEmail,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      message: 'Error creating task',
      error: error.message 
    });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
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

    await task.update({
      title: title !== undefined ? title.trim() : task.title,
      description: description !== undefined ? (description?.trim() || null) : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
      assigneeEmail: assigneeEmail,
      assigneeName: assigneeName,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      completedAt: completedAt
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      message: 'Error updating task',
      error: error.message 
    });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      message: 'Error deleting task',
      error: error.message 
    });
  }
});

export default router;

