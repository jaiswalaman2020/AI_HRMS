import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

// Authenticates a request via the Bearer token and attaches req.user.
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }

  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });
  if (user.status === 'terminated') {
    return res.status(403).json({ message: 'Account is deactivated' });
  }

  req.user = user;
  next();
});

// Restricts a route to one or more roles.
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};
