import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 }, // 1-12
    year: { type: Number, required: true },

    basic: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netPay: { type: Number, required: true },

    status: { type: String, enum: ['draft', 'processed', 'paid'], default: 'processed', index: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidOn: { type: Date },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);
