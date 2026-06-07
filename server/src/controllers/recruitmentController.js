import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { extractResumeText } from '../services/resumeParser.js';
import { screenResume, interviewReply } from '../services/aiService.js';

// ----------------------------- Jobs --------------------------------------
export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, postedBy: req.user._id });
  res.status(201).json({ job });
});

export const listJobs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const jobs = await Job.find(filter).sort({ createdAt: -1 });
  res.json({ jobs });
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ job });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ job });
});

// --------------------------- Candidates -----------------------------------

// POST /api/recruitment/jobs/:jobId/apply  (multipart: resume file + fields)
// Creates the candidate AND runs AI screening automatically (no human step).
export const applyAndScreen = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const resumeText = req.file
    ? await extractResumeText(req.file)
    : req.body.resumeText || '';

  if (!resumeText.trim()) {
    return res.status(400).json({ message: 'A resume file or resumeText is required' });
  }

  const candidate = await Candidate.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    job: job._id,
    resumeText,
    resumeFile: req.file?.originalname,
    yearsExperience: Number(req.body.yearsExperience) || 0,
    stage: 'applied',
  });

  // Automated AI evaluation.
  const screening = await screenResume({ resumeText, job });
  candidate.screening = screening;
  candidate.stage = screening.score >= 60 ? 'shortlisted' : 'ai_screened';
  await candidate.save();

  res.status(201).json({ candidate });
});

// POST /api/recruitment/candidates/:id/rescreen
export const rescreen = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('job');
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  const screening = await screenResume({ resumeText: candidate.resumeText, job: candidate.job });
  candidate.screening = screening;
  await candidate.save();
  res.json({ candidate });
});

// GET /api/recruitment/jobs/:jobId/candidates  — ranked by AI score
export const listCandidates = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.params.jobId) filter.job = req.params.jobId;
  if (req.query.stage) filter.stage = req.query.stage;
  const candidates = await Candidate.find(filter)
    .populate('job', 'title department')
    .sort({ 'screening.score': -1, createdAt: -1 });
  res.json({ candidates });
});

export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('job');
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json({ candidate });
});

// PUT /api/recruitment/candidates/:id/stage
export const updateStage = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findByIdAndUpdate(
    req.params.id,
    { stage: req.body.stage },
    { new: true }
  );
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json({ candidate });
});

// POST /api/recruitment/candidates/:id/interview  — one turn of AI screening chat
export const interviewTurn = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('job');
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

  const { message } = req.body;
  if (message) {
    candidate.interviewTranscript.push({ role: 'candidate', text: message });
  }

  const reply = await interviewReply({
    job: candidate.job,
    history: candidate.interviewTranscript,
    candidateName: candidate.name,
  });
  candidate.interviewTranscript.push({ role: 'ai', text: reply });
  if (candidate.stage === 'shortlisted') candidate.stage = 'interview';
  await candidate.save();

  res.json({ reply, transcript: candidate.interviewTranscript });
});
