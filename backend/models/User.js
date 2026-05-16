const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  companyName: {
    type: String,
    trim: true,
  },
  companyAddress: {
    type: String,
    trim: true,
  },
  companyPhone: {
    type: String,
    trim: true,
  },
  companyEmail: {
    type: String,
    trim: true,
  },
  companyCIN: {
    type: String,
    trim: true,
  },
  companyLogo: {
    type: String, // Base64 string
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  defaultWorkDays: {
    type: [Number],
    default: [1, 2, 3, 4, 5], // 0=Sun 1=Mon … 6=Sat; default Mon–Fri
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
