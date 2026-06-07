import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD for easy daily lookup
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'leave', 'remote'],
      default: 'present',
    },
    workedHours: { type: Number, default: 0 },
    note: { type: String },
  },
  { timestamps: true }
);

// One attendance record per employee per day.
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
