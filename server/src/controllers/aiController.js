import { asyncHandler } from '../middleware/asyncHandler.js';
import { assistantReply, aiStatus } from '../services/aiService.js';

// GET /api/ai/status
export const status = asyncHandler(async (req, res) => {
  res.json(aiStatus());
});

// POST /api/ai/assistant  — HR chatbot for the logged-in user
export const assistant = asyncHandler(async (req, res) => {
  const { history } = req.body;
  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ message: 'history (array of {role,text}) is required' });
  }
  const context = `Name: ${req.user.name}; Role: ${req.user.role}; Department: ${req.user.department || 'N/A'}.`;
  const reply = await assistantReply({ history, context });
  res.json({ reply });
});
