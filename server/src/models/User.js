import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALL_ROLES, ROLES } from '../config/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ALL_ROLES, default: ROLES.EMPLOYEE, index: true },

    // HR profile
    employeeId: { type: String, unique: true, sparse: true, index: true },
    department: { type: String, trim: true, index: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    dateOfJoining: { type: Date, default: Date.now },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    salary: { type: Number, default: 0 }, // monthly base, used by payroll
    status: { type: String, enum: ['active', 'on_leave', 'terminated'], default: 'active' },

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hash password whenever it is set/changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the hash even if a doc is accidentally serialized.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
