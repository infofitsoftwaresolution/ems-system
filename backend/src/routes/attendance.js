import { Router } from 'express';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all attendance data (for admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filter } = req.query;
    let whereClause = {};
    
    if (filter === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      whereClause.date = today;
    } else if (filter === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      whereClause.date = {
        [require('sequelize').Op.gte]: startOfWeek.toISOString().slice(0, 10)
      };
    } else if (filter === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      whereClause.date = {
        [require('sequelize').Op.gte]: startOfMonth.toISOString().slice(0, 10)
      };
    }
    // 'all' filter doesn't add any where clause
    
    const attendanceList = await Attendance.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['checkIn', 'DESC']]
    });

    // Join employee info by email to include employeeId
    const emails = [...new Set(attendanceList.map(r => r.email))];
    const employees = await Employee.findAll({
      where: { email: emails },
      attributes: ['email', 'employeeId', 'name']
    });
    const emailToEmployee = new Map(
      employees.map(e => [e.email, { employeeId: e.employeeId, name: e.name }])
    );

    const enriched = attendanceList.map(row => {
      const json = row.toJSON();
      const emp = emailToEmployee.get(json.email);
      if (emp) {
        json.employeeId = emp.employeeId || null;
        // Optionally backfill name if missing
        if (!json.name && emp.name) json.name = emp.name;
      }
      return json;
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    res.status(500).json({ message: 'Error fetching attendance data' });
  }
});

// Get today's attendance for a user
router.get('/today', authenticateToken, async (req, res) => {
  const email = String(req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ message: 'email required' });
  const today = new Date().toISOString().slice(0, 10);
  const row = await Attendance.findOne({ where: { email, date: today } });
  res.json(row || null);
});

// Check-in
router.post('/checkin', authenticateToken, async (req, res) => {
  const { email, name, latitude, longitude, address } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });
  
  console.log('Check-in request:', { email, name, latitude, longitude, address });
  
  const today = new Date().toISOString().slice(0, 10);
  let row = await Attendance.findOne({ where: { email, date: today } });
  if (row?.checkIn) return res.status(400).json({ message: 'Already checked in' });
  
  if (!row) {
    row = await Attendance.create({ 
      email: email.toLowerCase(), 
      name, 
      date: today, 
      checkIn: new Date(), 
      status: 'present',
      checkInLatitude: latitude || null,
      checkInLongitude: longitude || null,
      checkInAddress: address || null
    });
    console.log('Created new attendance record with location:', {
      checkInLatitude: row.checkInLatitude,
      checkInLongitude: row.checkInLongitude,
      checkInAddress: row.checkInAddress
    });
  } else {
    row.checkIn = new Date();
    row.checkInLatitude = latitude || null;
    row.checkInLongitude = longitude || null;
    row.checkInAddress = address || null;
    await row.save();
    console.log('Updated attendance record with location:', {
      checkInLatitude: row.checkInLatitude,
      checkInLongitude: row.checkInLongitude,
      checkInAddress: row.checkInAddress
    });
  }
  res.json(row);
});

// Check-out
router.post('/checkout', authenticateToken, async (req, res) => {
  const { email, latitude, longitude, address } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });
  
  console.log('Check-out request:', { email, latitude, longitude, address });
  
  const today = new Date().toISOString().slice(0, 10);
  const row = await Attendance.findOne({ where: { email: email.toLowerCase(), date: today } });
  if (!row?.checkIn) return res.status(400).json({ message: 'Check-in first' });
  if (row.checkOut) return res.status(400).json({ message: 'Already checked out' });
  
  row.checkOut = new Date();
  row.checkOutLatitude = latitude || null;
  row.checkOutLongitude = longitude || null;
  row.checkOutAddress = address || null;
  await row.save();
  
  console.log('Updated attendance record with check-out location:', {
    checkOutLatitude: row.checkOutLatitude,
    checkOutLongitude: row.checkOutLongitude,
    checkOutAddress: row.checkOutAddress
  });
  
  res.json(row);
});

export default router;


