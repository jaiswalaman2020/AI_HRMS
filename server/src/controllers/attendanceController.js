import Attendance from '../models/Attendance.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ROLES } from '../config/roles.js';
import { emitToRole } from '../sockets/index.js';

const today = () => new Date().toISOString().slice(0, 10);

// POST /api/attendance/check-in
export const checkIn = asyncHandler(async (req, res) => {
  const date = today();
  let record = await Attendance.findOne({ employee: req.user._id, date });
  if (record && record.checkIn) {
    return res.status(409).json({ message: 'Already checked in today' });
  }
  record = await Attendance.findOneAndUpdate(
    { employee: req.user._id, date },
    {
      employee: req.user._id,
      date,
      checkIn: new Date(),
      status: req.body.status || 'present',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Real-time: notify management dashboards that attendance changed.
  emitToRole([ROLES.ADMIN, ROLES.SENIOR_MANAGER], 'attendance:update', {
    employee: req.user._id,
    date,
  });
  res.status(201).json({ record });
});

// POST /api/attendance/check-out
export const checkOut = asyncHandler(async (req, res) => {
  const date = today();
  const record = await Attendance.findOne({ employee: req.user._id, date });
  if (!record || !record.checkIn) {
    return res.status(400).json({ message: 'You have not checked in today' });
  }
  record.checkOut = new Date();
  record.workedHours = Math.round(((record.checkOut - record.checkIn) / 3.6e6) * 100) / 100;
  await record.save();

  emitToRole([ROLES.ADMIN, ROLES.SENIOR_MANAGER], 'attendance:update', {
    employee: req.user._id,
    date,
  });
  res.json({ record });
});

// GET /api/attendance/me  — current user's history
export const myAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ employee: req.user._id }).sort({ date: -1 }).limit(60);
  res.json({ records });
});

// GET /api/attendance  — management view (optional ?date=&employee=)
export const listAttendance = asyncHandler(async (req, res) => {
  const { date, employee } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (employee) filter.employee = employee;
  if (!date && !employee) filter.date = today();

  const records = await Attendance.find(filter)
    .populate('employee', 'name employeeId department')
    .sort({ createdAt: -1 })
    .limit(500);
  res.json({ records });
});
