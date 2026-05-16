const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: String,
    designation: String,
    department: String,
    pfNumber: String,
    joiningDate: Date,
    type: {
      type: String,
      enum: ['Employee', 'Intern'],
      default: 'Employee',
    },
    overtimeEligible: {
      type: Boolean,
      default: false,
    },
    financials: {
      panNumber: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },
    salaryDetails: {
      annualCTC: {
        type: Number,
        default: 0,
      },
      baseSalary: {
        type: Number,
        default: 0,
      }, // Represents Monthly Stipend for Interns
    },
    leaveBalance: {
      casual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 }
    },
    internLeaveQuota: {
      type: Number,
      default: 1
    },
    // Working days override (null = inherit admin defaultWorkDays)
    workingDays: {
      type: [Number],
      default: undefined,
    },
    clientAssignment: {
      type: String,
      default: '',
    },
    // Portal Authentication Fields
    portalPassword: {
      type: String,
    },
    isPortalEnabled: {
      type: Boolean,
      default: false,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash portal password before saving
staffSchema.pre('save', async function (next) {
  if (!this.isModified('portalPassword')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.portalPassword = await bcrypt.hash(this.portalPassword, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to check password
staffSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.portalPassword) return false;
  return await bcrypt.compare(candidatePassword, this.portalPassword);
};

module.exports = mongoose.model('Staff', staffSchema);
