import { Router } from 'express';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = Router();

// Get all attendance data (for admin and manager/HR only)
router.get('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { filter } = req.query;
    let whereClause = {};
    
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);
      whereClause.date = todayStr;
    } else if (filter === 'week') {
      const now = new Date();
      const startOfWeek = new Date(now);
      // Get Monday of current week (0 = Sunday, 1 = Monday, etc.)
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
      whereClause.date = {
        [Op.gte]: startOfWeekStr
      };
    } else if (filter === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
      whereClause.date = {
        [Op.gte]: startOfMonthStr
      };
    }
    // 'all' filter doesn't add any where clause - returns all records
    
    // Add limit to prevent loading too many records at once
    const limit = parseInt(req.query.limit) || 1000;
    
    const attendanceList = await Attendance.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['checkIn', 'DESC']],
      limit: limit
    });

    // Handle empty attendance list
    if (!attendanceList || attendanceList.length === 0) {
      return res.json([]);
    }

    // Join employee info by email to include employeeId
    const emails = [...new Set(attendanceList.map(r => r.email).filter(Boolean))];
    let emailToEmployee = new Map();
    
    if (emails.length > 0) {
      try {
        const employees = await Employee.findAll({
          where: { email: emails },
          attributes: ['email', 'employeeId', 'name']
        });
        emailToEmployee = new Map(
          employees.map(e => [e.email, { employeeId: e.employeeId, name: e.name }])
        );
      } catch (empError) {
        console.error('Error fetching employee data:', empError);
        // Continue without employee data - attendance records will still be returned
      }
    }

    const enriched = attendanceList.map(row => {
      try {
        const json = row.toJSON();
        const emp = emailToEmployee.get(json.email);
        if (emp) {
          json.employeeId = emp.employeeId || null;
          // Optionally backfill name if missing
          if (!json.name && emp.name) json.name = emp.name;
        }
        
        // Calculate isLate if not set (for older records)
        if (json.checkIn && (json.isLate === null || json.isLate === undefined)) {
          try {
            const checkInTime = new Date(json.checkIn);
            const expectedCheckInTime = new Date(checkInTime);
            expectedCheckInTime.setHours(10, 0, 0, 0); // 10:00 AM
            json.isLate = checkInTime > expectedCheckInTime;
            
            // Update the record in database for future queries (async, don't await)
            row.isLate = json.isLate;
            row.save().catch(err => console.error('Error updating isLate:', err));
          } catch (dateError) {
            console.error('Error calculating isLate:', dateError);
            json.isLate = false;
          }
        }
        
        // Ensure isLate is a boolean (default to false if null/undefined)
        json.isLate = json.isLate === true;
        
        return json;
      } catch (rowError) {
        console.error('Error processing attendance row:', rowError);
        // Return basic row data if processing fails
        return row.toJSON();
      }
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching attendance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
  
  // Check if check-in is late (after 10:00 AM)
  const checkInTime = new Date();
  const expectedCheckInTime = new Date(checkInTime);
  expectedCheckInTime.setHours(10, 0, 0, 0); // 10:00 AM
  const isLate = checkInTime > expectedCheckInTime;
  
  if (!row) {
    row = await Attendance.create({ 
      email: email.toLowerCase(), 
      name, 
      date: today, 
      checkIn: checkInTime, 
      status: 'present',
      isLate: isLate,
      checkInLatitude: latitude || null,
      checkInLongitude: longitude || null,
      checkInAddress: address || null
    });
    console.log('Created new attendance record with location:', {
      checkInLatitude: row.checkInLatitude,
      checkInLongitude: row.checkInLongitude,
      checkInAddress: row.checkInAddress,
      isLate: row.isLate
    });
  } else {
    row.checkIn = checkInTime;
    row.isLate = isLate;
    row.checkInLatitude = latitude || null;
    row.checkInLongitude = longitude || null;
    row.checkInAddress = address || null;
    await row.save();
    console.log('Updated attendance record with location:', {
      checkInLatitude: row.checkInLatitude,
      checkInLongitude: row.checkInLongitude,
      checkInAddress: row.checkInAddress,
      isLate: row.isLate
    });
  }
  res.json(row);
});

// Check-out
router.post('/checkout', authenticateToken, async (req, res) => {
  const { email, latitude, longitude, address, checkoutType } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });
  
  console.log('Check-out request:', { email, latitude, longitude, address, checkoutType });
  
  const today = new Date().toISOString().slice(0, 10);
  const row = await Attendance.findOne({ where: { email: email.toLowerCase(), date: today } });
  if (!row?.checkIn) return res.status(400).json({ message: 'Check-in first' });
  if (row.checkOut) return res.status(400).json({ message: 'Already checked out' });
  
  row.checkOut = new Date();
  row.checkoutType = checkoutType || 'manual';
  row.checkOutLatitude = latitude || null;
  row.checkOutLongitude = longitude || null;
  row.checkOutAddress = address || null;
  await row.save();
  
  console.log('Updated attendance record with check-out location:', {
    checkOutLatitude: row.checkOutLatitude,
    checkOutLongitude: row.checkOutLongitude,
    checkOutAddress: row.checkOutAddress,
    checkoutType: row.checkoutType
  });
  
  res.json(row);
});

// Auto-checkout at midnight (11:59 PM) - called by cron job
router.post('/auto-checkout-midnight', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    // Find all attendance records that are checked in but not checked out
    const uncheckedOutRecords = await Attendance.findAll({
      where: {
        date: todayStr,
        checkIn: { [Op.ne]: null },
        checkOut: null
      }
    });
    
    console.log(`Found ${uncheckedOutRecords.length} records to auto-checkout at midnight`);
    
    // Set checkout time to 11:59 PM of the current day
    const checkoutTime = new Date(today);
    checkoutTime.setHours(23, 59, 0, 0);
    
    // Auto-checkout all records
    for (const record of uncheckedOutRecords) {
      record.checkOut = checkoutTime;
      record.checkoutType = 'auto-midnight';
      record.checkOutAddress = 'Auto-checkout (midnight reset)';
      await record.save();
      console.log(`Auto-checked out: ${record.email} at ${checkoutTime.toISOString()}`);
    }
    
    res.json({ 
      message: `Auto-checked out ${uncheckedOutRecords.length} employees`,
      count: uncheckedOutRecords.length 
    });
  } catch (error) {
    console.error('Error in auto-checkout:', error);
    res.status(500).json({ message: 'Error performing auto-checkout' });
  }
});

export default router;


