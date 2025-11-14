import { Router } from 'express';
import { Employee } from '../models/Employee.js';
import { Payslip } from '../models/Payslip.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Op } from 'sequelize';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Generate payslip for an employee
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    let { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ 
        message: 'Employee ID, month, and year are required' 
      });
    }

    // Convert month and year to integers
    month = parseInt(month, 10);
    year = parseInt(year, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ 
        message: 'Invalid month. Month must be between 1 and 12' 
      });
    }

    if (isNaN(year) || year < 2020 || year > 2030) {
      return res.status(400).json({ 
        message: 'Invalid year. Year must be between 2020 and 2030' 
      });
    }
    
    // Find employee by employeeId (which is a STRING in Employee model)
    const employee = await Employee.findOne({
      where: { employeeId: String(employeeId) }
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if payslip already exists for this month/year
    // Note: Payslip model stores employeeId as INTEGER, but we need to match by employeeId string
    // We'll check by employeeId string converted to match the Payslip model
    const existingPayslip = await Payslip.findOne({
      where: { 
        employeeId: employee.id, // Use employee.id (INTEGER) for Payslip model
        month: month,
        year: year
      }
    });
    
    if (existingPayslip) {
      return res.status(400).json({ 
        message: 'Payslip already exists for this month/year' 
      });
    }
    
    // Calculate attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Format dates for SQLite (YYYY-MM-DD)
    const startDateStr = startDate.toISOString().slice(0, 10);
    const endDateStr = endDate.toISOString().slice(0, 10);
    
    const attendanceRecords = await Attendance.findAll({
      where: {
        email: employee.email,
        date: {
          [Op.between]: [startDateStr, endDateStr]
        }
      }
    });
    
    // Calculate working days
    const totalDays = endDate.getDate();
    const workingDays = attendanceRecords.length > 0 
      ? attendanceRecords.filter(record => record.checkIn && record.checkOut).length
      : totalDays; // If no attendance records, assume full working days

    // Calculate leaves taken
    const leavesTaken = await Leave.findAll({
      where: {
        email: employee.email,
        startDate: {
          [Op.between]: [startDateStr, endDateStr]
        },
        status: 'approved'
      }
    });

    const leaveDays = leavesTaken.reduce((total, leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return total + diffDays;
    }, 0);

    // Calculate salary components
    const basicSalary = employee.salary || 0;
    const dailyRate = basicSalary / 30; // Assuming 30 days per month
    const earnedSalary = dailyRate * workingDays;
    const leaveDeduction = dailyRate * leaveDays;
    const netSalary = earnedSalary - leaveDeduction;
    
    // Create payslip
    // Note: Payslip model expects employeeId as INTEGER, so we use employee.id
    const payslip = await Payslip.create({
      employeeId: employee.id, // Use employee.id (INTEGER) instead of employee.employeeId (STRING)
      employeeName: employee.name,
      employeeEmail: employee.email,
      month: month,
      year: year,
      basicSalary: parseFloat(basicSalary),
      earnedSalary: parseFloat(earnedSalary),
      leaveDeduction: parseFloat(leaveDeduction),
      netSalary: parseFloat(netSalary),
      workingDays: workingDays,
      totalDays: totalDays,
      leaveDays: leaveDays,
      status: 'generated',
      generatedAt: new Date()
    });

    res.status(201).json({
      message: 'Payslip generated successfully',
      payslip: payslip
    });

  } catch (error) {
    console.error('Error generating payslip:', error);
    res.status(500).json({ 
      message: 'Error generating payslip',
      error: error.message 
    });
  }
});

// Get all payslips for an employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    let whereClause = { employeeId: employeeId };
    
    if (month && year) {
      whereClause.month = month;
      whereClause.year = year;
    }

    const payslips = await Payslip.findAll({
      where: whereClause,
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json(payslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ 
      message: 'Error fetching payslips',
      error: error.message 
    });
  }
});

// Get all payslips (admin view)
router.get('/all', async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    let whereClause = {};
    
    if (month && year) {
      whereClause.month = month;
      whereClause.year = year;
    }
    
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const payslips = await Payslip.findAll({
      where: whereClause,
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json(payslips);
  } catch (error) {
    console.error('Error fetching all payslips:', error);
    res.status(500).json({ 
      message: 'Error fetching payslips',
      error: error.message 
    });
  }
});

// Get payslip by ID
router.get('/:id', async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id);
    
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    res.json(payslip);
  } catch (error) {
    console.error('Error fetching payslip:', error);
    res.status(500).json({ 
      message: 'Error fetching payslip',
      error: error.message 
    });
  }
});

// Update payslip status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const payslip = await Payslip.findByPk(req.params.id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    await payslip.update({ status: status });
    
    res.json({
      message: 'Payslip status updated successfully',
      payslip: payslip
    });
  } catch (error) {
    console.error('Error updating payslip status:', error);
    res.status(500).json({ 
      message: 'Error updating payslip status',
      error: error.message 
    });
  }
});

// Delete payslip
router.delete('/:id', async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id);
    
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    await payslip.destroy();
    
    res.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ 
      message: 'Error deleting payslip',
      error: error.message 
    });
  }
});

export default router;
