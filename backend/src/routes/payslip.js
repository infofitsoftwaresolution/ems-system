import { Router } from 'express';
import { Payslip } from '../models/Payslip.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { authenticateToken } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = Router();

// Test endpoint to check if payslip table exists
router.get('/test', async (req, res) => {
  try {
    const count = await Payslip.count();
    res.json({ message: 'Payslip table exists', count });
  } catch (error) {
    console.error('Payslip table test error:', error);
    res.status(500).json({ message: 'Payslip table error', error: error.message });
  }
});

// Get payslips for an employee
router.get('/employee/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    const payslips = await Payslip.findAll({
      where: { employeeEmail: email.toLowerCase() },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    res.json(payslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ message: 'Error fetching payslips' });
  }
});

// Get all payslips (for admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const payslips = await Payslip.findAll({
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    res.json(payslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ message: 'Error fetching payslips' });
  }
});

// Generate payslip for an employee
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    console.log('Payslip generation request:', req.body);
    const { employeeEmail, month, year } = req.body;
    
    // Find employee
    const employee = await Employee.findOne({
      where: { email: employeeEmail.toLowerCase() }
    });
    
    console.log('Found employee:', employee ? employee.name : 'Not found');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if payslip already exists
    const existingPayslip = await Payslip.findOne({
      where: { 
        employeeEmail: employeeEmail.toLowerCase(),
        month,
        year
      }
    });
    
    if (existingPayslip) {
      return res.status(400).json({ message: 'Payslip already exists for this month' });
    }
    
    // Calculate working days from attendance
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDays = endDate.getDate();
    
    const attendanceRecords = await Attendance.findAll({
      where: {
        email: employeeEmail.toLowerCase(),
        date: {
          [require('sequelize').Op.between]: [startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]
        }
      }
    });
    
    const workingDays = attendanceRecords.filter(record => record.status === 'present').length;
    
    // Calculate salary (basic salary + allowances - deductions)
    const basicSalary = parseFloat(employee.salary) || 0;
    const allowances = 0; // Can be customized
    const deductions = 0; // Can be customized
    const netSalary = basicSalary + allowances - deductions;
    
    // Create payslip
    const payslip = await Payslip.create({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      netSalary,
      workingDays,
      totalDays,
      status: 'generated'
    });
    
    res.json(payslip);
  } catch (error) {
    console.error('Error generating payslip:', error);
    res.status(500).json({ message: 'Error generating payslip' });
  }
});

// Download payslip as PDF
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payslip = await Payslip.findByPk(id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    // Create PDF
    const doc = new PDFDocument();
    const fileName = `payslip_${payslip.employeeName}_${payslip.month}_${payslip.year}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'payslips', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Pipe PDF to file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Add content to PDF
    doc.fontSize(20).text('EMPLOYEE PAYSLIP', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Employee Name: ${payslip.employeeName}`);
    doc.text(`Employee Email: ${payslip.employeeEmail}`);
    doc.text(`Month: ${payslip.month}/${payslip.year}`);
    doc.text(`Generated Date: ${new Date(payslip.generatedAt).toLocaleDateString()}`);
    doc.moveDown();
    
    doc.fontSize(14).text('SALARY DETAILS', { underline: true });
    doc.moveDown();
    
    // Convert string values to numbers before using toFixed()
    const basicSalary = parseFloat(payslip.basicSalary) || 0;
    const allowances = parseFloat(payslip.allowances) || 0;
    const deductions = parseFloat(payslip.deductions) || 0;
    const netSalary = parseFloat(payslip.netSalary) || 0;
    
    doc.fontSize(12).text(`Basic Salary: ₹${basicSalary.toLocaleString('en-IN')}`);
    doc.text(`Allowances: ₹${allowances.toLocaleString('en-IN')}`);
    doc.text(`Deductions: ₹${deductions.toLocaleString('en-IN')}`);
    doc.moveDown();
    
    doc.fontSize(14).text(`Net Salary: ₹${netSalary.toLocaleString('en-IN')}`, { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).text('ATTENDANCE DETAILS', { underline: true });
    doc.moveDown();
    
    doc.text(`Working Days: ${payslip.workingDays}`);
    doc.text(`Total Days: ${payslip.totalDays}`);
    doc.text(`Attendance Rate: ${((payslip.workingDays / payslip.totalDays) * 100).toFixed(1)}%`);
    doc.moveDown();
    
    doc.fontSize(10).text('This is a computer generated document.', { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
    // Wait for file to be written
    stream.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).json({ message: 'Error downloading payslip' });
        }
        // Clean up file after download
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    });
    
  } catch (error) {
    console.error('Error downloading payslip:', error);
    res.status(500).json({ message: 'Error downloading payslip' });
  }
});

export default router;
