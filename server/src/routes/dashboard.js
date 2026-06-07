import { Router } from 'express';
import {
  myDashboard,
  companyDashboard,
  recruitmentDashboard,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';
import { MANAGEMENT, HR_ACCESS } from '../config/roles.js';

const router = Router();
router.use(protect);

router.get('/me', myDashboard);
router.get('/company', authorize(...MANAGEMENT), companyDashboard);
router.get('/recruitment', authorize(...HR_ACCESS), recruitmentDashboard);

export default router;
