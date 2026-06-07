import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ROLES } from '../config/roles.js';

// POST /api/auth/register  (admin creates accounts; public self-register defaults to employee)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, designation, salary } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  // Only an authenticated admin may assign a privileged role.
  const isAdmin = req.user && req.user.role === ROLES.ADMIN;
  const assignedRole = isAdmin && role ? role : ROLES.EMPLOYEE;

  const count = await User.countDocuments();
  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    department,
    designation,
    salary,
    employeeId: `EMP${String(count + 1).padStart(4, '0')}`,
  });

  res.status(201).json({ user, token: signToken(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  user.lastLogin = new Date();
  await user.save();

  res.json({ user, token: signToken(user) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('manager', 'name email');
  res.json({ user });
});
