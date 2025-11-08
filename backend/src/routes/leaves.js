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
  const userEmail = req.user?.email || req.user?.sub?.email || null;
  const userRole = req.user?.role || null;
  const queryEmail = req.query.email ? String(req.query.email).toLowerCase() : null;
  
  // Build where clause
  let where = {};
  
  // If user is not admin, only show their own leaves
  if (userRole !== 'admin' && userRole !== 'manager') {
    // Non-admin users can only see their own leaves
    if (userEmail) {
      where.email = userEmail.toLowerCase();
    } else {
      // If no user email found, return empty array for security
      return res.json([]);
    }
  } else {
    // Admin/Manager can see all leaves, or filter by email if provided
    if (queryEmail) {
      where.email = queryEmail;
    }
    // If no query email and user is admin, show all (where remains empty object)
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


