import { Router } from 'express';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Kyc } from '../models/Kyc.js';
import { Attendance } from '../models/Attendance.js';
import { Leave } from '../models/Leave.js';
import { Payslip } from '../models/Payslip.js';
import { AccessLog } from '../models/AccessLog.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { sendNewEmployeeEmail } from '../services/emailService.js';

const router = Router();

// Generate unique employee ID
const generateUniqueEmployeeId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EMP${year}${random}`;
};

// Generate temporary password
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8);
};

// Generate permanent employee ID
const generatePermanentEmployeeId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EMP${year}${random}`;
};

router.get('/', async (_req, res) => {
  const employees = await Employee.findAll({ order: [['id', 'ASC']] });
  res.json(employees);
});

router.get('/:id', async (req, res) => {
  const emp = await Employee.findByPk(req.params.id);
  if (!emp) return res.status(404).json({ message: 'Employee not found' });
  res.json(emp);
});

router.post('/', async (req, res) => {
  try {
    // Generate unique employee ID and temporary password
    const uniqueEmployeeId = generateUniqueEmployeeId();
    const tempPassword = generateTempPassword();
    
    // Convert name to uppercase before storing
    const employeeData = {
      ...req.body,
      name: req.body.name ? req.body.name.toUpperCase() : req.body.name,
      employeeId: uniqueEmployeeId,
      kycStatus: 'pending'
    };
    
    // Create employee with unique ID
    const emp = await Employee.create(employeeData);
    
    // Ensure user account exists
    const existing = await User.findOne({ where: { email: emp.email } });
    if (!existing) {
      const hash = await bcrypt.hash(tempPassword, 10);
      await User.create({
        email: emp.email,
        name: emp.name, // This will be the uppercase name from employeeData
        role: (emp.role?.toLowerCase().includes('admin') ? 'admin' : 
               emp.role?.toLowerCase().includes('manager') ? 'manager' : 'employee'),
        passwordHash: hash,
        mustChangePassword: true,
        active: true
      });
    } else {
      // Update existing user with new password if needed
      const hash = await bcrypt.hash(tempPassword, 10);
      await existing.update({
        name: emp.name, // Update with uppercase name
        passwordHash: hash,
        mustChangePassword: true,
        active: true
      });
    }
    
    // Send welcome email with temporary credentials
    const emailData = {
      fullName: emp.name,
      email: emp.email,
      tempEmployeeId: uniqueEmployeeId,
      tempPassword: tempPassword
    };
    
    await sendNewEmployeeEmail(emailData);
    
    res.status(201).json({
      ...emp.toJSON(),
      tempPassword: tempPassword // Include temp password in response for admin reference
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    
    // Convert name to uppercase if provided
    const updateData = {
      ...req.body,
      name: req.body.name ? req.body.name.toUpperCase() : req.body.name
    };
    
    // Update employee data
    await emp.update(updateData);
    
    // Also update the corresponding user account
    const user = await User.findOne({ where: { email: emp.email } });
    if (user) {
      await user.update({
        name: updateData.name || user.name,
        role: updateData.role || user.role,
        email: updateData.email || user.email
      });
    }
    
    res.json(emp);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    
    console.log(`Starting comprehensive deletion for employee: ${emp.name} (${emp.email})`);
    
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
          { employeeId: emp.employeeId },
          { fullName: emp.name }
        ]
      } 
    });
    
    for (const kycRecord of kycRecords) {
      // Delete associated files
      if (kycRecord.documents && kycRecord.documents.length > 0) {
        for (const doc of kycRecord.documents) {
          if (doc.path) {
            const filePath = path.join(process.cwd(), doc.path);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted KYC file: ${filePath}`);
            }
          }
        }
      }
      
      // Delete the KYC record
      await kycRecord.destroy();
      deletionSummary.kycRecords++;
      console.log(`Deleted KYC record for employee: ${emp.name}`);
    }
    
    // 2. Delete associated attendance records
    const attendanceRecords = await Attendance.findAll({ 
      where: { 
        email: emp.email.toLowerCase()
      } 
    });
    
    for (const attendanceRecord of attendanceRecords) {
      await attendanceRecord.destroy();
      deletionSummary.attendanceRecords++;
      console.log(`Deleted attendance record for employee: ${emp.name} on ${attendanceRecord.date}`);
    }
    
    // 3. Delete associated leave records
    const leaveRecords = await Leave.findAll({ 
      where: { 
        email: emp.email.toLowerCase()
      } 
    });
    
    for (const leaveRecord of leaveRecords) {
      // Delete associated attachment files if any
      if (leaveRecord.attachmentUrl) {
        const filePath = path.join(process.cwd(), leaveRecord.attachmentUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted leave attachment file: ${filePath}`);
        }
      }
      
      await leaveRecord.destroy();
      deletionSummary.leaveRecords++;
      console.log(`Deleted leave record for employee: ${emp.name} (${leaveRecord.type})`);
    }
    
    // 4. Delete associated payslip records
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
      console.log(`Deleted payslip record for employee: ${emp.name} (${payslipRecord.month}/${payslipRecord.year})`);
    }
    
    // 5. Delete associated access logs
    const accessLogs = await AccessLog.findAll({ 
      where: { 
        email: emp.email.toLowerCase()
      } 
    });
    
    for (const accessLog of accessLogs) {
      await accessLog.destroy();
      deletionSummary.accessLogs++;
    }
    console.log(`Deleted ${accessLogs.length} access log records for employee: ${emp.name}`);
    
    // 6. Delete the corresponding user account
    const user = await User.findOne({ where: { email: emp.email } });
    if (user) {
      await user.destroy();
      deletionSummary.userAccount = true;
      console.log(`Deleted user account for: ${emp.email}`);
    }
    
    // 7. Finally delete the employee record
    await emp.destroy();
    console.log(`Deleted employee record: ${emp.name}`);
    
    res.json({ 
      success: true, 
      message: 'Employee and all associated data deleted successfully',
      deletedEmployee: {
        name: emp.name,
        email: emp.email,
        employeeId: emp.employeeId
      },
      deletionSummary: {
        kycRecords: deletionSummary.kycRecords,
        attendanceRecords: deletionSummary.attendanceRecords,
        leaveRecords: deletionSummary.leaveRecords,
        payslipRecords: deletionSummary.payslipRecords,
        accessLogs: deletionSummary.accessLogs,
        userAccount: deletionSummary.userAccount
      }
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

export default router;


