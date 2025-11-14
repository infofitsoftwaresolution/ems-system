import { Router } from 'express';
import { Course } from '../models/Course.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Request a new course
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { title, category, description, email, name } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, category, and description are required' 
      });
    }

    // Create course request with status 'draft' (pending approval)
    const courseRequest = await Course.create({
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      status: 'draft', // Course requests start as draft until approved
      createdByEmail: email || req.user?.email || null,
    });

    res.status(201).json({
      message: 'Course request submitted successfully',
      course: courseRequest,
    });
  } catch (error) {
    console.error('Error creating course request:', error);
    res.status(500).json({ 
      message: 'Error submitting course request',
      error: error.message 
    });
  }
});

// Get all courses (for admin/managers)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      message: 'Error fetching courses',
      error: error.message 
    });
  }
});

// Get course requests (draft status)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const requests = await Course.findAll({
      where: { status: 'draft' },
      order: [['createdAt', 'DESC']],
    });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching course requests:', error);
    res.status(500).json({ 
      message: 'Error fetching course requests',
      error: error.message 
    });
  }
});

export default router;

