import { Router } from 'express';
import multer from 'multer';
import {
  createJob,
  listJobs,
  getJob,
  updateJob,
  applyAndScreen,
  rescreen,
  listCandidates,
  getCandidate,
  updateStage,
  interviewTurn,
} from '../controllers/recruitmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { HR_ACCESS } from '../config/roles.js';

// Keep resume in memory; we extract text and discard the binary.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();

// ---- Public career-portal routes (no login) ----
// Candidates browse jobs, apply (auto AI screening) and take the AI screening
// interview themselves. The interview is candidate-facing by design — recruiters
// only review the resulting transcript.
router.get('/jobs', listJobs);
router.get('/jobs/:id', getJob);
router.post('/jobs/:jobId/apply', upload.single('resume'), applyAndScreen);
router.post('/candidates/:id/interview', interviewTurn);

// ---- Everything below is HR/management only ----
router.use(protect, authorize(...HR_ACCESS));

router.post('/jobs', createJob);
router.put('/jobs/:id', updateJob);
router.get('/jobs/:jobId/candidates', listCandidates);
router.get('/candidates', listCandidates);
router.get('/candidates/:id', getCandidate);
router.post('/candidates/:id/rescreen', rescreen);
router.put('/candidates/:id/stage', updateStage);

export default router;
