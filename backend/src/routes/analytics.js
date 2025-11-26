import { Router } from 'express';
import { Op } from 'sequelize';
import { Attendance } from '../models/Attendance.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Event } from '../models/Event.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sequelize } from '../sequelize.js';

const router = Router();

// Helper to get date extraction function based on dialect
const getDateFunction = (model) => {
  const dialect = model.sequelize.getDialect();
  if (dialect === 'sqlite') {
    return model.sequelize.fn('date', model.sequelize.col('date'));
  } else {
    // PostgreSQL
    return model.sequelize.fn('DATE', model.sequelize.col('date'));
  }
};

const getDateFunctionForColumn = (model, columnName) => {
  const dialect = model.sequelize.getDialect();
  if (dialect === 'sqlite') {
    return model.sequelize.fn('date', model.sequelize.col(columnName));
  } else {
    // PostgreSQL
    return model.sequelize.fn('DATE', model.sequelize.col(columnName));
  }
};

/**
 * Get team activity analytics
 * Returns daily activity metrics for the specified time range
 * @query period: 'week' | 'month' | 'year'
 */
router.get('/team-activity', authenticateToken, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Initialize all dates in range with zero values
    const activityMap = new Map();
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      activityMap.set(dateStr, {
        date: dateStr,
        activeUsers: 0,
        completedTasks: 0,
        newDocuments: 0,
        attendanceCount: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get all attendance records and process in memory (more reliable)
    let attendanceRecords = [];
    try {
      attendanceRecords = await Attendance.findAll({
        where: {
          date: {
            [Op.gte]: startDate,
            [Op.lte]: now
          }
        },
        attributes: ['date', 'email', 'checkIn'],
        raw: true
      });
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
    
    // Process attendance data
    const attendanceByDate = {};
    const activeUsersByDate = {};
    attendanceRecords.forEach(record => {
      if (record.date) {
        try {
          const dateStr = new Date(record.date).toISOString().split('T')[0];
          attendanceByDate[dateStr] = (attendanceByDate[dateStr] || 0) + 1;
          
          if (record.checkIn && record.email) {
            if (!activeUsersByDate[dateStr]) {
              activeUsersByDate[dateStr] = new Set();
            }
            activeUsersByDate[dateStr].add(record.email);
          }
        } catch (e) {
          console.error('Error processing attendance record:', e, record);
        }
      }
    });
    
    // Get all completed tasks and process in memory
    let completedTasksData = [];
    try {
      completedTasksData = await Task.findAll({
        where: {
          status: 'completed',
          completedAt: {
            [Op.gte]: startDate,
            [Op.lte]: now
          }
        },
        attributes: ['completedAt'],
        raw: true
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
    
    const tasksByDate = {};
    completedTasksData.forEach(task => {
      if (task.completedAt) {
        try {
          const dateStr = new Date(task.completedAt).toISOString().split('T')[0];
          tasksByDate[dateStr] = (tasksByDate[dateStr] || 0) + 1;
        } catch (e) {
          console.error('Error processing task:', e, task);
        }
      }
    });
    
    // Get all new events and process in memory
    // Use raw SQL query to avoid Sequelize field mapping issues
    let newEventsData = [];
    try {
      const dialect = sequelize.getDialect();
      if (dialect === 'sqlite') {
        newEventsData = await sequelize.query(
          `SELECT created_at FROM events WHERE created_at >= ? AND created_at <= ?`,
          {
            replacements: [startDate.toISOString(), now.toISOString()],
            type: sequelize.QueryTypes.SELECT
          }
        );
      } else {
        // PostgreSQL
        newEventsData = await sequelize.query(
          `SELECT created_at FROM events WHERE created_at >= :startDate AND created_at <= :endDate`,
          {
            replacements: { startDate: startDate.toISOString(), endDate: now.toISOString() },
            type: sequelize.QueryTypes.SELECT
          }
        );
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
    
    const eventsByDate = {};
    newEventsData.forEach(event => {
      const dateValue = event.created_at;
      if (dateValue) {
        try {
          const dateStr = new Date(dateValue).toISOString().split('T')[0];
          eventsByDate[dateStr] = (eventsByDate[dateStr] || 0) + 1;
        } catch (e) {
          console.error('Error parsing event date:', e, event);
        }
      }
    });
    
    // Populate activity map with actual data
    activityMap.forEach((value, dateStr) => {
      if (attendanceByDate[dateStr]) {
        value.attendanceCount = attendanceByDate[dateStr];
      }
      if (activeUsersByDate[dateStr]) {
        value.activeUsers = activeUsersByDate[dateStr].size;
      }
      if (tasksByDate[dateStr]) {
        value.completedTasks = tasksByDate[dateStr];
      }
      if (eventsByDate[dateStr]) {
        value.newDocuments = eventsByDate[dateStr];
      }
    });
    
    
    // Convert map to array and sort by date
    const activityData = Array.from(activityMap.values()).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    res.json({
      success: true,
      data: activityData,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching team activity:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching team activity data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get training metrics
 * Returns training completion rates and statistics
 */
router.get('/training-metrics', authenticateToken, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    // Get all active employees and process in memory (more reliable)
    const employees = await Employee.findAll({
      where: { is_active: true },
      attributes: ['id', 'designation', 'kycStatus'],
      raw: true
    });
    
    const totalEmployees = employees.length;
    const employeesWithKYC = employees.filter(emp => emp.kycStatus === 'approved').length;
    
    // Calculate overall completion rate
    const overallCompletionRate = totalEmployees > 0
      ? Math.round((employeesWithKYC / totalEmployees) * 100)
      : 0;
    
    // Group by designation
    const byDesignation = {};
    employees.forEach(emp => {
      const designation = emp.designation || 'Unassigned';
      if (!byDesignation[designation]) {
        byDesignation[designation] = {
          name: designation,
          total: 0,
          completed: 0
        };
      }
      byDesignation[designation].total++;
      if (emp.kycStatus === 'approved') {
        byDesignation[designation].completed++;
      }
    });
    
    // Format training metrics
    const trainingMetrics = Object.values(byDesignation).map(dept => ({
      name: dept.name,
      total: dept.total,
      completed: dept.completed,
      completionRate: dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0
    }));
    
    res.json({
      success: true,
      data: {
        overallCompletionRate,
        totalEmployees,
        employeesWithKYC,
        byDepartment: trainingMetrics
      }
    });
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching training metrics',
      error: error.message
    });
  }
});

/**
 * Get department statistics
 * Returns employee distribution and statistics by department
 */
router.get('/departments', authenticateToken, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { is_active: true },
      attributes: ['id', 'department', 'designation', 'location', 'status']
    });
    
    // Group by department (using location or designation as fallback)
    const departmentStats = {};
    
    employees.forEach(emp => {
      const dept = emp.department || emp.location || emp.designation || 'Unassigned';
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          name: dept,
          total: 0,
          working: 0,
          onLeave: 0,
          notWorking: 0
        };
      }
      
      departmentStats[dept].total++;
      if (emp.status === 'Working') {
        departmentStats[dept].working++;
      } else if (emp.status === 'On Leave') {
        departmentStats[dept].onLeave++;
      } else {
        departmentStats[dept].notWorking++;
      }
    });
    
    const departmentData = Object.values(departmentStats).map(dept => ({
      name: dept.name,
      value: dept.total,
      working: dept.working,
      onLeave: dept.onLeave,
      notWorking: dept.notWorking
    }));
    
    res.json({
      success: true,
      data: departmentData,
      total: employees.length
    });
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department statistics',
      error: error.message
    });
  }
});

export default router;

