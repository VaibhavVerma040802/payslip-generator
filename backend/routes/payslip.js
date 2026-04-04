const express = require('express');
const router = express.Router();
const Payslip = require('../models/Payslip');
const { generatePayslipPDF } = require('../utils/pdfGenerator');
const { sendPayslipEmail } = require('../utils/emailService');
const { auth } = require('./auth');

// Apply auth middleware to all routes
router.use(auth);

// ─────────────────────────────────────────────────────────────
// POST /api/payslips — Create a new payslip
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
      console.error('❌ Create payslip error: req.user is undefined');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    console.log(`📝 Creating payslip for employee: ${req.body.employeeName} (User ID: ${userId})`);
    
    // Defensive numeric casting
    const numericFields = [
      'annualCTC', 'stipend', 'employerPF', 'basicSalary', 'hra', 
      'conveyanceAllowance', 'medicalAllowance', 'specialAllowance', 'otherEarnings',
      'providentFund', 'esi', 'tds', 'professionalTax', 'loanDeduction', 'otherDeductions',
      'workingDays', 'paidDays', 'year'
    ];

    const payslipData = { ...req.body, user: userId };
    
    numericFields.forEach(field => {
      const val = parseFloat(payslipData[field]);
      payslipData[field] = isNaN(val) ? 0 : val;
    });

    // Automatically inherit branding if missing in payload
    if (!payslipData.companyLogo && req.user.companyLogo) {
      payslipData.companyLogo = req.user.companyLogo;
    }
    
    const payslip = new Payslip(payslipData);
    await payslip.save();
    
    console.log(`✅ Payslip saved successfully: ${payslip._id}`);
    res.status(201).json({ success: true, message: 'Payslip created successfully', data: payslip });
  } catch (err) {
    console.error('❌ Create payslip CRASH:', err);
    
    // Explicitly handle validation errors to help the user
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed: ' + errors.join(', '),
        details: err.errors 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Critical error: ' + err.message,
      type: err.name
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payslips — List all payslips (with search/filter)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, month, year, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (search) {
      // Escape regex special characters to prevent injection
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { employeeName: { $regex: sanitizedSearch, $options: 'i' } },
        { employeeId: { $regex: sanitizedSearch, $options: 'i' } },
        { department: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }
    if (month && month !== 'All Months') filter.month = month;
    if (year && year !== 'All Years') {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) filter.year = yearNum;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Payslip.countDocuments(filter);
    const payslips = await Payslip.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('employeeName employeeId designation department month year netSalary emailSent createdAt');

    res.json({
      success: true,
      data: payslips,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('List payslips error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payslips' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payslips/:id — Get a single payslip
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const payslip = await Payslip.findOne({ _id: req.params.id, user: req.user._id });
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    res.json({ success: true, data: payslip });
  } catch (err) {
    console.error('Get payslip error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payslip' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/payslips/:id — Update a payslip
// ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const payslip = await Payslip.findOne({ _id: req.params.id, user: req.user._id });
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    Object.assign(payslip, req.body);
    await payslip.save();
    res.json({ success: true, message: 'Payslip updated', data: payslip });
  } catch (err) {
    console.error('Update payslip error:', err);
    res.status(500).json({ success: false, message: 'Failed to update payslip' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/payslips/:id — Delete a payslip
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const payslip = await Payslip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    res.json({ success: true, message: 'Payslip deleted successfully' });
  } catch (err) {
    console.error('Delete payslip error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete payslip' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payslips/:id/download — Download payslip as PDF
// ─────────────────────────────────────────────────────────────
router.get('/:id/download', async (req, res) => {
  try {
    const payslip = await Payslip.findOne({ _id: req.params.id, user: req.user._id });
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    generatePayslipPDF(payslip, res);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/payslips/:id/email — Email payslip to employee
// ─────────────────────────────────────────────────────────────
router.post('/:id/email', async (req, res) => {
  try {
    const payslip = await Payslip.findOne({ _id: req.params.id, user: req.user._id });
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    // Allow overriding recipient email via request body
    const targetEmail = req.body.email || payslip.employeeEmail;
    const payslipToSend = { ...payslip.toObject(), employeeEmail: targetEmail };

    await sendPayslipEmail(payslipToSend);

    // Mark email as sent
    payslip.emailSent = true;
    payslip.emailSentAt = new Date();
    await payslip.save();

    res.json({
      success: true,
      message: `Payslip emailed successfully to ${targetEmail}`,
      sentTo: targetEmail,
    });
  } catch (err) {
    console.error('Email payslip error:', err);
    const message = err.message.includes('credentials')
      ? err.message
      : 'Failed to send email. Check your email credentials in .env';
    res.status(500).json({ success: false, message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payslips/stats/summary — Dashboard stats
// ─────────────────────────────────────────────────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const filter = { user: req.user._id };
    const total = await Payslip.countDocuments(filter);
    const thisMonth = new Date();
    const monthName = thisMonth.toLocaleString('en-US', { month: 'long' });
    const year = thisMonth.getFullYear();

    const thisMonthCount = await Payslip.countDocuments({ ...filter, month: monthName, year });
    const emailsSent = await Payslip.countDocuments({ ...filter, emailSent: true });

    const netSalaryAgg = await Payslip.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalNet: { $sum: '$netSalary' }, avgNet: { $avg: '$netSalary' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalPayslips: total,
        thisMonthPayslips: thisMonthCount,
        emailsSent,
        totalPayroll: netSalaryAgg[0]?.totalNet || 0,
        avgSalary: Math.round(netSalaryAgg[0]?.avgNet || 0),
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
