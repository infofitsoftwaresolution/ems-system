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
router.get('/', authenticateToken, async (req, res) => {
  const email = req.query.email ? String(req.query.email).toLowerCase() : null;
  const where = email ? { email } : undefined;
  const rows = await Leave.findAll({ where, order: [['id', 'DESC']] });
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


