import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  departments,
} from '../controllers/employeeController.js';
import { register } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, HR_ACCESS } from '../config/roles.js';

const router = Router();
router.use(protect);

router.get('/', authorize(...HR_ACCESS), listEmployees);
router.get('/meta/departments', departments);
router.post('/', authorize(ROLES.ADMIN), register); // admin creates an employee account
router.get('/:id', getEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', authorize(ROLES.ADMIN), deleteEmployee);

export default router;
