import { Router } from 'express';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = Router();

// Get all attendance data (for admin, manager, and HR only)
router.get('/', authenticateToken, requireRole(['admin', 'manager', 'hr']), async (req, res) => {
  // Wrap everything in a try-catch to ensure we always return a valid response
  try {
    console.log('📊 Fetching attendance data with filter:', req.query.filter);
    console.log('📊 Request user:', req.user);
    
    // Check if models are available
    if (!Attendance || typeof Attendance.findAll !== 'function') {
      console.error('❌ Attendance model not available');
      return res.json([]);
    }
    
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
    
    // Build query options - simplify to avoid issues
    let queryOptions = {
      order: [['date', 'DESC'], ['checkIn', 'DESC']],
      limit: limit
    };
    
    // Only add where clause if it's not empty
    if (Object.keys(whereClause).length > 0) {
      queryOptions.where = whereClause;
    }
    
    console.log('📋 Query options:', JSON.stringify(queryOptions, null, 2));
    
    let attendanceList = [];
    try {
      console.log('🔍 Executing Attendance.findAll...');
      console.log('🔍 Where clause:', whereClause);
      console.log('🔍 Filter:', filter);
      
      // Build the query options - specify attributes to avoid missing column errors
      // Only select columns that exist in the database
      const findAllOptions = {
        attributes: [
          'id', 'email', 'name', 'date', 'checkIn', 'checkOut', 
          'status', 'notes', 
          'checkInLatitude', 'checkInLongitude', 'checkInAddress',
          'checkOutLatitude', 'checkOutLongitude', 'checkOutAddress',
          'checkInPhoto', 'checkOutPhoto', // Photo fields
          'isLate', 'checkoutType', // Late status and checkout type
          'createdAt', 'updatedAt'
        ],
        order: [['date', 'DESC'], ['checkIn', 'DESC']],
        limit: limit,
        raw: false // Return Sequelize instances, not plain objects
      };
      
      // Only add where clause if it's not empty
      if (Object.keys(whereClause).length > 0) {
        findAllOptions.where = whereClause;
      }
      
      console.log('🔍 FindAll options:', JSON.stringify(findAllOptions, null, 2));
      
      // Execute the query
      attendanceList = await Attendance.findAll(findAllOptions);
      
      console.log(`✅ Found ${attendanceList ? attendanceList.length : 0} attendance records`);
      console.log('✅ Attendance list type:', Array.isArray(attendanceList) ? 'Array' : typeof attendanceList);
    } catch (attendanceError) {
      console.error('❌ Error fetching attendance records:', attendanceError);
      console.error('Attendance error name:', attendanceError.name);
      console.error('Attendance error message:', attendanceError.message);
      console.error('Attendance error stack:', attendanceError.stack);
      if (attendanceError.original) {
        console.error('Original error message:', attendanceError.original.message);
        console.error('Original error code:', attendanceError.original.code);
        console.error('Original error detail:', attendanceError.original.detail);
      }
      if (attendanceError.errors) {
        console.error('Validation errors:', attendanceError.errors);
      }
      // Return empty array instead of throwing - allow the request to complete
      attendanceList = [];
    }

    // Handle empty attendance list
    if (!attendanceList || attendanceList.length === 0) {
      console.log('📭 No attendance records found, returning empty array');
      return res.json([]);
    }

    // Join employee info by email to include employeeId
    const emails = [...new Set(attendanceList.map(r => {
      try {
        return r.email;
      } catch (e) {
        return null;
      }
    }).filter(Boolean))];
    
    console.log(`👥 Found ${emails.length} unique emails in attendance records`);
    
    let emailToEmployee = new Map();
    
    if (emails.length > 0) {
      try {
        // Check if Employee model is available
        if (!Employee || typeof Employee.findAll !== 'function') {
          console.warn('⚠️ Employee model not available, skipping employee data enrichment');
        } else {
          console.log('🔍 Fetching employee data...');
          const employees = await Employee.findAll({
            where: { 
              email: {
                [Op.in]: emails
              }
            },
            attributes: ['email', 'employeeId', 'name']
          });
          
          console.log(`✅ Found ${employees?.length || 0} employees`);
          
          if (employees && Array.isArray(employees)) {
            emailToEmployee = new Map(
              employees
                .filter(e => e && e.email) // Filter out any null/undefined employees
                .map(e => [String(e.email).toLowerCase(), { 
                  employeeId: e.employeeId || null, 
                  name: e.name || null 
                }])
            );
          }
        }
      } catch (empError) {
        console.error('❌ Error fetching employee data:', empError);
        console.error('Employee error details:', empError.message);
        if (empError.stack) {
          console.error('Employee error stack:', empError.stack);
        }
        // Continue without employee data - attendance records will still be returned
        emailToEmployee = new Map();
      }
    }

    console.log('🔄 Enriching attendance data...');
    const enriched = attendanceList.map((row, index) => {
      try {
        let json;
        try {
          json = row.toJSON ? row.toJSON() : row;
        } catch (jsonError) {
          console.error(`Error converting row ${index} to JSON:`, jsonError);
          json = row; // Use row as-is if toJSON fails
        }
        
        // Normalize email for lookup
        const emailKey = json.email ? String(json.email).toLowerCase() : null;
        if (emailKey) {
          const emp = emailToEmployee.get(emailKey);
          if (emp) {
            json.employeeId = emp.employeeId || null;
            // Optionally backfill name if missing
            if (!json.name && emp.name) json.name = emp.name;
          }
        }
        
        // Calculate isLate if not set (for older records)
        if (json.checkIn && (json.isLate === null || json.isLate === undefined)) {
          try {
            const checkInTime = new Date(json.checkIn);
            if (!isNaN(checkInTime.getTime())) {
              const expectedCheckInTime = new Date(checkInTime);
              expectedCheckInTime.setHours(10, 0, 0, 0); // 10:00 AM
              json.isLate = checkInTime > expectedCheckInTime;
              
              // Update the record in database for future queries (async, don't await)
              if (row && typeof row.save === 'function') {
                row.isLate = json.isLate;
                row.save().catch(err => console.error('Error updating isLate:', err));
              }
            } else {
              json.isLate = false;
            }
          } catch (dateError) {
            console.error('Error calculating isLate:', dateError);
            json.isLate = false;
          }
        }
        
        // Ensure isLate is a boolean (default to false if null/undefined)
        json.isLate = json.isLate === true;
        
        return json;
      } catch (rowError) {
        console.error(`Error processing attendance row ${index}:`, rowError);
        // Return basic row data if processing fails
        try {
          return row.toJSON ? row.toJSON() : row;
        } catch {
          return { error: 'Failed to process row' };
        }
      }
    });

    console.log(`✅ Returning ${enriched.length} enriched attendance records`);
    res.json(enriched);
  } catch (error) {
    console.error('========================================');
    console.error('ERROR FETCHING ATTENDANCE LIST');
    console.error('========================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.original) {
      console.error('Original error:', error.original);
      console.error('Original error message:', error.original.message);
      console.error('Original error code:', error.original.code);
    }
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('========================================');
    
    // Always return a valid JSON response, even on error
    // Return empty array instead of error to prevent frontend crashes
    try {
      console.error('⚠️ Returning empty array due to error (instead of 500)');
      // Return empty array instead of error status to allow frontend to handle gracefully
      if (!res.headersSent) {
        return res.json([]);
      }
    } catch (responseError) {
      // If even sending the response fails, log it
      console.error('❌ Failed to send response:', responseError);
      if (!res.headersSent) {
        try {
          res.status(500).json({ message: 'Error fetching attendance data' });
        } catch {
          res.end();
        }
      }
    }
  }
});

// Test endpoint to check database connection and data count
router.get('/test', authenticateToken, requireRole(['admin', 'manager', 'hr']), async (req, res) => {
  try {
    console.log('🧪 Testing attendance database connection...');
    
    // Test 1: Check if model is available
    const modelAvailable = Attendance && typeof Attendance.findAll === 'function';
    console.log('✅ Model available:', modelAvailable);
    
    // Test 2: Try a simple count query
    let totalCount = 0;
    try {
      totalCount = await Attendance.count();
      console.log('✅ Total attendance records:', totalCount);
    } catch (countError) {
      console.error('❌ Count query failed:', countError.message);
    }
    
    // Test 3: Try to fetch one record
    let sampleRecord = null;
    try {
      sampleRecord = await Attendance.findOne({ limit: 1 });
      console.log('✅ Sample record found:', !!sampleRecord);
    } catch (findError) {
      console.error('❌ FindOne query failed:', findError.message);
    }
    
    res.json({
      modelAvailable,
      totalCount,
      hasSampleRecord: !!sampleRecord,
      sampleRecord: sampleRecord ? sampleRecord.toJSON() : null,
      message: 'Database connection test completed'
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
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
  const { email, name, latitude, longitude, address, photoBase64 } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });
  
  console.log('Check-in request:', { email, name, latitude, longitude, address, hasPhoto: !!photoBase64 });
  
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
      checkInAddress: address || null,
      checkInPhoto: photoBase64 || null
    });
    console.log('Created new attendance record with location and photo:', {
      checkInLatitude: row.checkInLatitude,
      checkInLongitude: row.checkInLongitude,
      checkInAddress: row.checkInAddress,
      isLate: row.isLate,
      hasPhoto: !!row.checkInPhoto
    });
  } else {
    row.checkIn = checkInTime;
    row.isLate = isLate;
    row.checkInLatitude = latitude || null;
    row.checkInLongitude = longitude || null;
    row.checkInAddress = address || null;
    row.checkInPhoto = photoBase64 || null;
    await row.save();
    console.log('Updated attendance record with location and photo:', {
      checkInLatitude: row.checkInLatitude,
      checkInLongitude: row.checkInLongitude,
      checkInAddress: row.checkInAddress,
      isLate: row.isLate,
      hasPhoto: !!row.checkInPhoto
    });
  }
  res.json(row);
});

// Check-out
router.post('/checkout', authenticateToken, async (req, res) => {
  const { email, latitude, longitude, address, checkoutType, photoBase64 } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });
  
  console.log('Check-out request:', { email, latitude, longitude, address, checkoutType, hasPhoto: !!photoBase64 });
  
  const today = new Date().toISOString().slice(0, 10);
  const row = await Attendance.findOne({ where: { email: email.toLowerCase(), date: today } });
  if (!row?.checkIn) return res.status(400).json({ message: 'Check-in first' });
  if (row.checkOut) return res.status(400).json({ message: 'Already checked out' });
  
  row.checkOut = new Date();
  row.checkoutType = checkoutType || 'manual';
  row.checkOutLatitude = latitude || null;
  row.checkOutLongitude = longitude || null;
  row.checkOutAddress = address || null;
  row.checkOutPhoto = photoBase64 || null;
  await row.save();
  
  console.log('Updated attendance record with check-out location and photo:', {
    checkOutLatitude: row.checkOutLatitude,
    checkOutLongitude: row.checkOutLongitude,
    checkOutAddress: row.checkOutAddress,
    checkoutType: row.checkoutType,
    hasPhoto: !!row.checkOutPhoto
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


