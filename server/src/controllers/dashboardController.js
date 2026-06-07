import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import Performance from '../models/Performance.js';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const today = () => new Date().toISOString().slice(0, 10);

// GET /api/dashboard/me  — personalised activity dashboard for any user.
export const myDashboard = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const [attendanceToday, recentAttendance, pendingLeaves, latestPayslip, latestReview] =
    await Promise.all([
      Attendance.findOne({ employee: uid, date: today() }),
      Attendance.find({ employee: uid }).sort({ date: -1 }).limit(7),
      LeaveRequest.countDocuments({ employee: uid, status: 'pending' }),
      Payroll.findOne({ employee: uid }).sort({ year: -1, month: -1 }),
      Performance.findOne({ employee: uid, status: 'published' }).sort({ period: -1 }),
    ]);

  const presentDays = await Attendance.countDocuments({ employee: uid, status: 'present' });

  res.json({
    profile: {
      name: req.user.name,
      role: req.user.role,
      department: req.user.department,
      designation: req.user.designation,
      employeeId: req.user.employeeId,
    },
    attendanceToday,
    recentAttendance,
    pendingLeaves,
    latestPayslip,
    latestReview,
    stats: {
      presentDays,
      avgRating: latestReview?.rating || null,
    },
  });
});

// GET /api/dashboard/company  — company-wide dashboard (admin / senior manager).
export const companyDashboard = asyncHandler(async (req, res) => {
  const [
    totalEmployees,
    activeEmployees,
    onLeave,
    presentToday,
    pendingLeaves,
    byDepartment,
    byRole,
    openJobs,
    totalCandidates,
    shortlisted,
    payrollAgg,
    avgRatingAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'on_leave' }),
    Attendance.countDocuments({ date: today(), status: { $in: ['present', 'remote'] } }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    User.aggregate([
      { $match: { department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Job.countDocuments({ status: 'open' }),
    Candidate.countDocuments(),
    Candidate.countDocuments({ stage: { $in: ['shortlisted', 'interview', 'offer'] } }),
    Payroll.aggregate([
      { $group: { _id: { year: '$year', month: '$month' }, total: { $sum: '$netPay' } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 1 },
    ]),
    Performance.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
  ]);

  const attendanceRate = activeEmployees
    ? Math.round((presentToday / activeEmployees) * 100)
    : 0;

  res.json({
    headline: {
      totalEmployees,
      activeEmployees,
      onLeave,
      presentToday,
      attendanceRate,
      pendingLeaves,
      openJobs,
      totalCandidates,
      shortlisted,
      latestPayrollTotal: payrollAgg[0]?.total || 0,
      avgPerformance: avgRatingAgg[0]?.avg ? Math.round(avgRatingAgg[0].avg * 10) / 10 : null,
    },
    byDepartment: byDepartment.map((d) => ({ department: d._id, count: d.count })),
    byRole: byRole.map((r) => ({ role: r._id, count: r.count })),
  });
});

// GET /api/dashboard/recruitment  — recruiter-focused funnel metrics.
export const recruitmentDashboard = asyncHandler(async (req, res) => {
  const [funnel, topCandidates, openJobs] = await Promise.all([
    Candidate.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Candidate.find({ 'screening.score': { $exists: true } })
      .sort({ 'screening.score': -1 })
      .limit(5)
      .populate('job', 'title'),
    Job.find({ status: 'open' }).select('title department').limit(20),
  ]);
  res.json({
    funnel: funnel.map((f) => ({ stage: f._id, count: f.count })),
    topCandidates,
    openJobs,
  });
});
