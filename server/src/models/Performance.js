import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  },
  { _id: false }
);

const performanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    period: { type: String, required: true }, // e.g. "2026-Q1"
    rating: { type: Number, min: 1, max: 5, default: 3 }, // overall 1-5
    kpis: {
      productivity: { type: Number, min: 0, max: 100, default: 0 },
      quality: { type: Number, min: 0, max: 100, default: 0 },
      teamwork: { type: Number, min: 0, max: 100, default: 0 },
    },
    goals: [goalSchema],
    feedback: { type: String },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

performanceSchema.index({ employee: 1, period: 1 }, { unique: true });

export default mongoose.model('Performance', performanceSchema);
