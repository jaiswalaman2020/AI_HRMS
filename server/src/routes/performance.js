import { Router } from 'express';
import {
  upsertReview,
  myReviews,
  listReviews,
  getReview,
} from '../controllers/performanceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { MANAGEMENT } from '../config/roles.js';

const router = Router();
router.use(protect);

router.get('/me', myReviews);
router.post('/', authorize(...MANAGEMENT), upsertReview);
router.get('/', authorize(...MANAGEMENT), listReviews);
router.get('/:id', getReview);

export default router;
