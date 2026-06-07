import LeaveRequest from '../models/LeaveRequest.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { MANAGEMENT } from '../config/roles.js';
import { emitToRole } from '../sockets/index.js';

const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);

// POST /api/leave  — employee applies for leave
export const applyLeave = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start and end dates are required' });
  }
  const leave = await LeaveRequest.create({
    employee: req.user._id,
    type,
    startDate,
    endDate,
    days: daysBetween(startDate, endDate),
    reason,
  });
  emitToRole(MANAGEMENT, 'leave:new', { id: leave._id });
  res.status(201).json({ leave });
});

// GET /api/leave/me
export const myLeaves = asyncHandler(async (req, res) => {
  const leaves = await LeaveRequest.find({ employee: req.user._id }).sort({ createdAt: -1 });
  res.json({ leaves });
});

// GET /api/leave  — management list (?status=pending)
export const listLeaves = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const leaves = await LeaveRequest.find(filter)
    .populate('employee', 'name employeeId department')
    .sort({ createdAt: -1 });
  res.json({ leaves });
});

// PUT /api/leave/:id/review  — approve/reject
export const reviewLeave = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be approved or rejected' });
  }
  const leave = await LeaveRequest.findByIdAndUpdate(
    req.params.id,
    { status, reviewNote, reviewedBy: req.user._id },
    { new: true }
  );
  if (!leave) return res.status(404).json({ message: 'Leave request not found' });
  res.json({ leave });
});
