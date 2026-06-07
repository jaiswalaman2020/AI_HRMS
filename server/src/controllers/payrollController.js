import Payroll from '../models/Payroll.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// Simple progressive-ish tax: 10% of (basic+allowances) for demo purposes.
const computeNet = ({ basic, allowances = 0, deductions = 0 }) => {
  const gross = basic + allowances;
  const tax = Math.round(gross * 0.1);
  const netPay = gross - deductions - tax;
  return { tax, netPay };
};

// POST /api/payroll/generate  — generate payroll for a month/year (all active employees)
export const generatePayroll = asyncHandler(async (req, res) => {
  const month = Number(req.body.month);
  const year = Number(req.body.year);
  if (!month || !year) return res.status(400).json({ message: 'month and year are required' });

  const employees = await User.find({ status: { $ne: 'terminated' } }).select('salary');
  const ops = [];
  for (const emp of employees) {
    const basic = emp.salary || 0;
    const allowances = Math.round(basic * 0.2); // 20% allowance for demo
    const { tax, netPay } = computeNet({ basic, allowances });
    ops.push({
      updateOne: {
        filter: { employee: emp._id, month, year },
        update: {
          $set: {
            employee: emp._id,
            month,
            year,
            basic,
            allowances,
            deductions: 0,
            tax,
            netPay,
            status: 'processed',
            processedBy: req.user._id,
          },
        },
        upsert: true,
      },
    });
  }
  if (ops.length) await Payroll.bulkWrite(ops);
  res.json({ message: `Payroll generated for ${month}/${year}`, count: ops.length });
});

// GET /api/payroll/me
export const myPayslips = asyncHandler(async (req, res) => {
  const payslips = await Payroll.find({ employee: req.user._id }).sort({ year: -1, month: -1 });
  res.json({ payslips });
});

// GET /api/payroll  — management list (?month=&year=)
export const listPayroll = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = {};
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  const payslips = await Payroll.find(filter)
    .populate('employee', 'name employeeId department')
    .sort({ createdAt: -1 })
    .limit(1000);
  const totalPayout = payslips.reduce((s, p) => s + p.netPay, 0);
  res.json({ payslips, totalPayout });
});

// PUT /api/payroll/:id/pay  — mark a payslip as paid
export const markPaid = asyncHandler(async (req, res) => {
  const payslip = await Payroll.findByIdAndUpdate(
    req.params.id,
    { status: 'paid', paidOn: new Date() },
    { new: true }
  );
  if (!payslip) return res.status(404).json({ message: 'Payslip not found' });
  res.json({ payslip });
});
