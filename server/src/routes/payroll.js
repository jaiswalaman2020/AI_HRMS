import { Router } from 'express';
import {
  generatePayroll,
  myPayslips,
  listPayroll,
  markPaid,
} from '../controllers/payrollController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, MANAGEMENT } from '../config/roles.js';

const router = Router();
router.use(protect);

router.get('/me', myPayslips);
router.post('/generate', authorize(ROLES.ADMIN), generatePayroll);
router.get('/', authorize(...MANAGEMENT), listPayroll);
router.put('/:id/pay', authorize(ROLES.ADMIN), markPaid);

export default router;
