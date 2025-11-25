import { Router } from 'express';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Kyc } from '../models/Kyc.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Payslip } from '../models/Payslip.js';
import { AccessLog } from '../models/AccessLog.js';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../sequelize.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { sendNewEmployeeEmail } from '../services/emailService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate emp_id in format RST1001, RST1002, etc.
const generateEmpId = async () => {
  try {
    // Find the highest emp_id that matches RST#### pattern
    const employees = await Employee.findAll({
      where: {
        emp_id: {
          [Op.like]: 'RST%'
        }
      },
      order: [['emp_id', 'DESC']],
      limit: 1
    });

    if (employees.length === 0) {
      // No employees with RST prefix, start from RST1001
      return 'RST1001';
    }

    const lastEmpId = employees[0].emp_id;
    // Extract the number part (e.g., "RST1003" -> 1003)
    const match = lastEmpId.match(/RST(\d+)/);
    
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      return `RST${nextNumber}`;
    } else {
      // If pattern doesn't match, start from RST1001
      return 'RST1001';
    }
  } catch (error) {
    console.error('Error generating emp_id:', error);
    // Fallback: generate based on current count
    const count = await Employee.count();
    return `RST${1001 + count}`;
  }
};

// Generate temporary password
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8);
};

// CSV export helper
const convertToCSV = (employees) => {
  const headers = ['No', 'Emp Id', 'Name of Employee', 'Mobile Number', 'Mail Id', 'Location', 'Designation', 'Status'];
  const rows = employees.map((emp, index) => [
    index + 1,
    emp.emp_id || emp.employeeId || 'N/A',
    emp.name || 'N/A',
    emp.mobile_number || 'N/A',
    emp.email || 'N/A',
    emp.location || emp.department || 'N/A',
    emp.designation || emp.position || 'N/A',
    emp.status || 'N/A'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
};

// GET /api/employees - Get all employees (including soft-deleted)
router.get('/', async (req, res) => {
  try {
    // Optional query parameter to filter active/inactive employees
    const { filter } = req.query; // 'active', 'inactive', or undefined (all)
    
    let whereClause = {};
    if (filter === 'active') {
      whereClause.is_active = true;
    } else if (filter === 'inactive') {
      whereClause.is_active = false;
    }
    // If no filter, return all employees (both active and soft-deleted)
    
    const employees = await Employee.findAll({ 
      where: whereClause,
      order: [['id', 'ASC']],
      attributes: [
        'id', 'emp_id', 'name', 'email', 'mobile_number', 
        'location', 'designation', 'status', 'is_active',
        // Legacy fields for backward compatibility
        'employeeId', 'department', 'position', 'role', 'hireDate', 'salary', 'kycStatus'
      ]
    });
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching employees', 
      error: error.message 
    });
  }
});

// GET /api/employees/:id - Get single employee (including soft-deleted)
router.get('/:id', async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    
    if (!emp) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }
    
    res.json({
      success: true,
      data: emp
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching employee', 
      error: error.message 
    });
  }
});

// POST /api/employees - Create new employee
router.post('/', async (req, res) => {
  try {
    // Validation
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required fields',
        error: 'VALIDATION_ERROR'
      });
    }

    if (!validateEmail(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
    }

    // Check if employee with this email already exists
    const existingEmployee = await Employee.findOne({ where: { email: req.body.email } });
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee with this email already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }

    // Generate or use provided emp_id
    let empId = req.body.emp_id;
    if (!empId || empId.trim() === '') {
      // Auto-generate emp_id if not provided
      empId = await generateEmpId();
    } else {
      // Validate provided emp_id is unique
      empId = empId.trim();
      const existingEmpId = await Employee.findOne({ where: { emp_id: empId } });
      if (existingEmpId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists',
          error: 'DUPLICATE_EMP_ID'
        });
      }
    }

    // Prepare employee data
    const employeeData = {
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      emp_id: empId,
      mobile_number: req.body.mobile_number || null,
      location: req.body.location || null,
      designation: req.body.designation || null,
      status: req.body.status === 'Not Working' ? 'Not Working' : 'Working',
      is_active: true, // New employees are always active
      // Legacy fields for backward compatibility
      employeeId: empId,
      department: req.body.location || req.body.department || null,
      position: req.body.designation || req.body.position || null,
      kycStatus: 'pending'
    };

    // Create employee
    const emp = await Employee.create(employeeData);

    // Create or update user account
    const tempPassword = generateTempPassword();
    const existingUser = await User.findOne({ where: { email: emp.email } });
    
    if (!existingUser) {
      const hash = await bcrypt.hash(tempPassword, 10);
      await User.create({
        email: emp.email,
        name: emp.name,
        role: 'employee',
        passwordHash: hash,
        mustChangePassword: true,
        active: true
      });
    } else {
      const hash = await bcrypt.hash(tempPassword, 10);
      await existingUser.update({
        name: emp.name,
        passwordHash: hash,
        mustChangePassword: true,
        active: true
      });
    }

    // Send welcome email
    try {
      const emailData = {
        fullName: emp.name,
        email: emp.email,
        tempEmployeeId: emp.emp_id,
        tempPassword: tempPassword
      };
      await sendNewEmployeeEmail(emailData);
      console.log('✅ Welcome email sent successfully to:', emp.email);
    } catch (emailError) {
      console.error('📧 Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        ...emp.toJSON(),
        tempPassword: tempPassword // Include temp password in response for admin reference
      }
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'field';
      return res.status(400).json({
        success: false,
        message: `${field} must be unique`,
        error: 'UNIQUE_CONSTRAINT_VIOLATION'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating employee', 
      error: error.message 
    });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    // Validation
    if (req.body.email && !validateEmail(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
    }

    // Check if email is being changed and if new email already exists
    if (req.body.email && req.body.email !== emp.email) {
      const existingEmployee = await Employee.findOne({ 
        where: { 
          email: req.body.email,
          id: { [Op.ne]: emp.id }
        } 
      });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this email already exists',
          error: 'DUPLICATE_EMAIL'
        });
      }
    }

    // Check if emp_id is being changed and if new emp_id already exists
    if (req.body.emp_id && req.body.emp_id !== emp.emp_id) {
      const existingEmpId = await Employee.findOne({ 
        where: { 
          emp_id: req.body.emp_id,
          id: { [Op.ne]: emp.id }
        } 
      });
      if (existingEmpId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists',
          error: 'DUPLICATE_EMP_ID'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.email) updateData.email = req.body.email.trim().toLowerCase();
    if (req.body.emp_id !== undefined) {
      updateData.emp_id = req.body.emp_id;
      updateData.employeeId = req.body.emp_id; // Update legacy field too
    }
    if (req.body.mobile_number !== undefined) updateData.mobile_number = req.body.mobile_number;
    if (req.body.location !== undefined) {
      updateData.location = req.body.location;
      updateData.department = req.body.location; // Update legacy field too
    }
    if (req.body.designation !== undefined) {
      updateData.designation = req.body.designation;
      updateData.position = req.body.designation; // Update legacy field too
    }
    if (req.body.status !== undefined) {
      updateData.status = req.body.status === 'Not Working' ? 'Not Working' : 'Working';
    }

    // Update employee
    await emp.update(updateData);

    // Update corresponding user account
    const user = await User.findOne({ where: { email: emp.email } });
    if (user) {
      const userUpdateData = {};
      if (updateData.name) userUpdateData.name = updateData.name;
      if (updateData.email) userUpdateData.email = updateData.email;
      await user.update(userUpdateData);
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: emp
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'field';
      return res.status(400).json({
        success: false,
        message: `${field} must be unique`,
        error: 'UNIQUE_CONSTRAINT_VIOLATION'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating employee', 
      error: error.message 
    });
  }
});

// DELETE /api/employees/:id - Delete employee (Admin: hard delete, HR: soft delete)
router.delete('/:id', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const userRole = req.user.role; // Get user role from token
    const isAdmin = userRole === 'admin';
    const isHR = userRole === 'hr';

    const emp = await Employee.findOne({
      where: {
        id: req.params.id,
        ...(isHR ? { is_active: true } : {}) // HR can only delete active employees
      }
    });
    
    if (!emp) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found or already deleted' 
      });
    }

    if (isAdmin) {
      // ADMIN: Hard delete (permanent deletion)
      console.log(`Starting hard delete (permanent) for employee: ${emp.name} (${emp.email})`);

      // Track deletion counts
      const deletionSummary = {
        kycRecords: 0,
        attendanceRecords: 0,
        leaveRecords: 0,
        payslipRecords: 0,
        accessLogs: 0,
        userAccount: false
      };

      // 1. Delete associated KYC records and files
      const kycRecords = await Kyc.findAll({ 
        where: { 
          [Op.or]: [
            { employeeId: emp.emp_id || emp.employeeId },
            { fullName: emp.name }
          ]
        } 
      });

      for (const kycRecord of kycRecords) {
        if (kycRecord.documents && kycRecord.documents.length > 0) {
          for (const doc of kycRecord.documents) {
            if (doc.path) {
              const filePath = path.join(process.cwd(), doc.path);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
        await kycRecord.destroy();
        deletionSummary.kycRecords++;
      }

      // 2. Delete associated attendance records
      const attendanceRecords = await Attendance.findAll({ 
        where: { email: emp.email.toLowerCase() } 
      });

      for (const attendanceRecord of attendanceRecords) {
        await attendanceRecord.destroy();
        deletionSummary.attendanceRecords++;
      }

      // 3. Delete associated leave records
      const leaveRecords = await Leave.findAll({ 
        where: { email: emp.email.toLowerCase() } 
      });

      for (const leaveRecord of leaveRecords) {
        if (leaveRecord.attachmentUrl) {
          const filePath = path.join(process.cwd(), leaveRecord.attachmentUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        await leaveRecord.destroy();
        deletionSummary.leaveRecords++;
      }

      // 4. Delete associated payslip records
      try {
        const payslipRecords = await Payslip.findAll({ 
          where: { 
            [Op.or]: [
              { employeeId: emp.id },
              { employeeEmail: emp.email.toLowerCase() }
            ]
          }
        });

        for (const payslipRecord of payslipRecords) {
          await payslipRecord.destroy();
          deletionSummary.payslipRecords++;
        }
      } catch (payslipError) {
        console.error('Error deleting payslip records:', payslipError.message);
      }

      // 5. Delete associated access logs
      const accessLogs = await AccessLog.findAll({ 
        where: { email: emp.email.toLowerCase() } 
      });

      for (const accessLog of accessLogs) {
        await accessLog.destroy();
        deletionSummary.accessLogs++;
      }

      // 6. Delete the corresponding user account
      const user = await User.findOne({ where: { email: emp.email } });
      if (user) {
        await user.destroy();
        deletionSummary.userAccount = true;
      }

      // 7. Finally delete the employee record permanently
      await emp.destroy();

      res.json({ 
        success: true,
        message: 'Employee permanently deleted successfully',
        data: {
          deletedEmployee: {
            name: emp.name,
            email: emp.email,
            emp_id: emp.emp_id || emp.employeeId
          },
          deletionSummary,
          deletionType: 'permanent'
        }
      });
    } else if (isHR) {
      // HR: Soft delete only
      console.log(`Starting soft delete for employee: ${emp.name} (${emp.email})`);

      // Perform soft delete: set is_active = false and status = "Not Working"
      await emp.update({
        is_active: false,
        status: 'Not Working'
      });

      // Also deactivate the corresponding user account
      const user = await User.findOne({ where: { email: emp.email } });
      if (user) {
        await user.update({ active: false });
        console.log(`Deactivated user account for: ${emp.email}`);
      }

      res.json({ 
        success: true,
        message: 'Employee soft deleted successfully',
        data: {
          deletedEmployee: {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            emp_id: emp.emp_id || emp.employeeId,
            is_active: false,
            status: 'Not Working'
          },
          deletionType: 'soft'
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Only Admin and HR can delete employees.',
        error: 'FORBIDDEN'
      });
    }
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting employee', 
      error: error.message 
    });
  }
});

// GET /api/employees/export/csv - Export all active employees as CSV
router.get('/export/csv', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const employees = await Employee.findAll({ 
      where: {
        is_active: true // Only export active employees
      },
      order: [['id', 'ASC']],
      attributes: [
        'id', 'emp_id', 'name', 'email', 'mobile_number', 
        'location', 'designation', 'status',
        'employeeId', 'department', 'position' // Legacy fields
      ]
    });

    const csvContent = convertToCSV(employees);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting employees:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error exporting employees', 
      error: error.message 
    });
  }
});

// GET /api/employees/:id/export/csv - Export single active employee as CSV
router.get('/:id/export/csv', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const emp = await Employee.findOne({
      where: {
        id: req.params.id,
        is_active: true // Only export if active
      }
    });
    
    if (!emp) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
    }

    const csvContent = convertToCSV([emp]);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="employee_${emp.emp_id || emp.id}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting employee:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error exporting employee', 
      error: error.message 
    });
  }
});

export default router;
