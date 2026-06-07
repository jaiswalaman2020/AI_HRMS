import Performance from '../models/Performance.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ROLES } from '../config/roles.js';

// POST /api/performance  — create/update a review (manager/admin)
export const upsertReview = asyncHandler(async (req, res) => {
  const { employee, period, rating, kpis, goals, feedback, status } = req.body;
  if (!employee || !period) {
    return res.status(400).json({ message: 'employee and period are required' });
  }
  const review = await Performance.findOneAndUpdate(
    { employee, period },
    {
      employee,
      period,
      reviewer: req.user._id,
      rating,
      kpis,
      goals,
      feedback,
      status: status || 'draft',
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json({ review });
});

// GET /api/performance/me
export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Performance.find({ employee: req.user._id, status: 'published' })
    .sort({ period: -1 })
    .populate('reviewer', 'name');
  res.json({ reviews });
});

// GET /api/performance  — management list (?employee=)
export const listReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.employee) filter.employee = req.query.employee;
  const reviews = await Performance.find(filter)
    .populate('employee', 'name employeeId department')
    .populate('reviewer', 'name')
    .sort({ createdAt: -1 })
    .limit(500);
  res.json({ reviews });
});

// GET /api/performance/:id
export const getReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id).populate('employee reviewer', 'name');
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (
    req.user.role === ROLES.EMPLOYEE &&
    String(review.employee._id) !== String(req.user._id)
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ review });
});
