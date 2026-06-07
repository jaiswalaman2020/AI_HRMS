import { Router } from 'express';
import { status, assistant } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/status', status);
router.post('/assistant', protect, assistant);

export default router;
