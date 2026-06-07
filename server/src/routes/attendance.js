import { Router } from 'express';
import {
  checkIn,
  checkOut,
  myAttendance,
  listAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { HR_ACCESS } from '../config/roles.js';

const router = Router();
router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/me', myAttendance);
router.get('/', authorize(...HR_ACCESS), listAttendance);

export default router;
