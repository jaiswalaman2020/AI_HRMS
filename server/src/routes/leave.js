import { Router } from 'express';
import {
  applyLeave,
  myLeaves,
  listLeaves,
  reviewLeave,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/auth.js';
import { MANAGEMENT } from '../config/roles.js';

const router = Router();
router.use(protect);

router.post('/', applyLeave);
router.get('/me', myLeaves);
router.get('/', authorize(...MANAGEMENT), listLeaves);
router.put('/:id/review', authorize(...MANAGEMENT), reviewLeave);

export default router;
