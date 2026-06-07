import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ROLES } from '../config/roles.js';

// GET /api/employees  — list/search with pagination (scales to thousands)
export const listEmployees = asyncHandler(async (req, res) => {
  const { search, department, role, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { employeeId: new RegExp(search, 'i') },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const perPage = Math.min(100, parseInt(limit, 10));

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate('manager', 'name email'),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / perPage) });
});

// GET /api/employees/:id
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id).populate('manager', 'name email');
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  // Employees may only view their own profile.
  if (req.user.role === ROLES.EMPLOYEE && String(req.user._id) !== req.params.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ employee });
});

// PUT /api/employees/:id
export const updateEmployee = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'department', 'designation', 'manager', 'salary', 'status', 'role', 'avatar'];
  // Employees can only edit a limited set of their own fields.
  const selfOnly = ['name', 'phone', 'avatar'];

  const isSelf = String(req.user._id) === req.params.id;
  const isManagement = [ROLES.ADMIN, ROLES.SENIOR_MANAGER].includes(req.user.role);
  if (!isManagement && !isSelf) return res.status(403).json({ message: 'Forbidden' });

  const fields = isManagement ? allowed : selfOnly;
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];

  // Only admins may change roles.
  if (updates.role && req.user.role !== ROLES.ADMIN) delete updates.role;

  const employee = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json({ employee });
});

// DELETE /api/employees/:id  (soft delete -> terminated)
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'terminated' },
    { new: true }
  );
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json({ message: 'Employee deactivated', employee });
});

// GET /api/employees/meta/departments  — distinct department list for filters
export const departments = asyncHandler(async (req, res) => {
  const list = await User.distinct('department', { department: { $ne: null } });
  res.json({ departments: list.filter(Boolean) });
});
