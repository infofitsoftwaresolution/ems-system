import { Router } from 'express';
import { Leave } from '../models/Leave.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Apply for leave
router.post('/', authenticateToken, async (req, res) => {
  const body = req.body;
  if (!body?.email || !body?.startDate || !body?.endDate) return res.status(400).json({ message: 'Missing fields' });
  const created = await Leave.create({
    email: body.email.toLowerCase(),
    name: body.name,
    type: body.type || 'casual',
    startDate: body.startDate,
    endDate: body.endDate,
    reason: body.reason || '',
    attachmentUrl: body.attachmentUrl || ''
  });
  res.status(201).json(created);
});

// List leaves (optionally by email)
// For non-admin users, only show their own leaves
// For admin users, show all leaves if no email filter is provided
router.get('/', authenticateToken, async (req, res) => {
  const userRole = req.user?.role || null;
  const userId = req.user?.sub || null;
  const queryEmail = req.query.email ? String(req.query.email).toLowerCase() : null;
  
  // Build where clause
  let where = {};
  
  // If user is not admin/manager/hr, only show their own leaves
  if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'hr') {
    // Get user email from User model using user ID from token
    if (userId) {
      try {
        const { User } = await import('../models/User.js');
        const user = await User.findByPk(userId);
        if (user && user.email) {
          where.email = user.email.toLowerCase();
        } else {
          // If user not found, return empty array for security
          return res.json([]);
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
        return res.json([]);
      }
    } else {
      // If no user ID found, return empty array for security
      return res.json([]);
    }
  } else {
    // Admin/Manager/HR can see all leaves, or filter by email if provided
    if (queryEmail) {
      where.email = queryEmail;
    }
    // If no query email and user is admin/manager/hr, show all (where remains empty object)
  }
  
  const rows = await Leave.findAll({ 
    where: Object.keys(where).length > 0 ? where : undefined, 
    order: [['id', 'DESC']] 
  });
  res.json(rows);
});

// Review leave
router.post('/:id/review', authenticateToken, async (req, res) => {
  const { status, reviewedBy, remarks } = req.body;
  const row = await Leave.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'Not found' });
  row.status = status;
  row.reviewedBy = reviewedBy;
  row.reviewedAt = new Date();
  row.remarks = remarks;
  await row.save();
  res.json(row);
});

export default router;


