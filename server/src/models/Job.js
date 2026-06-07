import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, trim: true, index: true },
    location: { type: String, trim: true },
    type: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], default: 'full_time' },
    description: { type: String, required: true },
    // Skills/requirements the AI screener matches candidates against.
    requiredSkills: [{ type: String }],
    minExperience: { type: Number, default: 0 }, // years
    salaryRange: { min: Number, max: Number },
    status: { type: String, enum: ['open', 'closed', 'on_hold'], default: 'open', index: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
