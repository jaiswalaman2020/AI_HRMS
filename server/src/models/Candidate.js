import mongoose from 'mongoose';

const screeningSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100 }, // AI fit score
    recommendation: { type: String, enum: ['strong_yes', 'yes', 'maybe', 'no'] },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    strengths: [{ type: String }],
    concerns: [{ type: String }],
    summary: { type: String },
    model: { type: String }, // which AI model produced this
    screenedAt: { type: Date },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    // Transcript of the AI voice/chat screening conversation.
    role: { type: String, enum: ['ai', 'candidate'] },
    text: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },

    resumeText: { type: String }, // extracted text from uploaded resume
    resumeFile: { type: String }, // stored filename
    yearsExperience: { type: Number, default: 0 },

    screening: screeningSchema, // AI evaluation result (auto, no human needed)
    interviewTranscript: [interviewSchema],

    stage: {
      type: String,
      enum: ['applied', 'ai_screened', 'shortlisted', 'interview', 'offer', 'rejected', 'hired'],
      default: 'applied',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Candidate', candidateSchema);
