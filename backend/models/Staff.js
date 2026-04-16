const mongoose = require('mongoose');

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
    joiningDate: Date,
    type: {
      type: String,
      enum: ['Employee', 'Intern'],
      default: 'Employee',
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
