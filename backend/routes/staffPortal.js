const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Staff = require('../models/Staff');
const User = require('../models/User'); // Required to get company details if needed
const { sendPasswordResetEmail } = require('../utils/emailService');

// Middleware to verify Staff JWT
const authStaff = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Ensure the token has the correct audience for staff
    if (decoded.aud !== 'staff') {
      throw new Error('Invalid token audience');
    }

    const staff = await Staff.findById(decoded.id).populate('user', 'companyName companyLogo');
    if (!staff || !staff.isPortalEnabled) throw new Error('Access denied');

    req.staff = staff;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Please authenticate as staff' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/portal/login — Staff Login
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const staff = await Staff.findOne({ email: email.toLowerCase().trim() }).populate('user', 'companyName companyLogo');
    
    if (!staff || !staff.isPortalEnabled) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or portal disabled' });
    }

    // Check lock state
    if (staff.lockUntil && staff.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((staff.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${waitMinutes} minutes.` });
    }

    const isMatch = await staff.comparePassword(password);
    
    if (!isMatch) {
      staff.loginAttempts += 1;
      if (staff.loginAttempts >= 5) {
        staff.lockUntil = Date.now() + 15 * 60000; // Lock for 15 mins
      }
      await staff.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Successful login, reset attempts
    staff.loginAttempts = 0;
    staff.lockUntil = undefined;
    staff.lastLogin = Date.now();
    await staff.save();

    // Sign JWT with audience 'staff'
    const token = jwt.sign(
      { id: staff._id, aud: 'staff' }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      mustChangePassword: staff.mustChangePassword,
      staff: {
        id: staff._id,
        fullName: staff.fullName,
        email: staff.email,
        employeeId: staff.employeeId,
        designation: staff.designation,
        companyName: staff.user?.companyName,
        companyLogo: staff.user?.companyLogo,
      }
    });

  } catch (err) {
    console.error('Staff login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/portal/change-password — Mandatory First Login Change
// ─────────────────────────────────────────────────────────────
router.post('/change-password', authStaff, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!req.staff.mustChangePassword) {
      return res.status(400).json({ success: false, message: 'Password change not mandatory' });
    }

    const isMatch = await req.staff.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    // Password rules validation
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' 
      });
    }

    req.staff.portalPassword = newPassword;
    req.staff.mustChangePassword = false;
    await req.staff.save();

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/portal/forgot-password — Send Reset Link
// ─────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const staff = await Staff.findOne({ email: email.toLowerCase().trim() });
    
    // Same security logic as admin auth to prevent enum
    if (!staff || !staff.isPortalEnabled) {
      return res.json({ success: true, message: 'If that email exists and has portal access, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    staff.passwordResetToken = resetToken;
    staff.passwordResetExpires = Date.now() + 15 * 60000; // 15 minutes expiry
    await staff.save();

    try {
      const origin = process.env.FRONTEND_URL || 
                     req.get('origin') || 
                     (req.get('x-forwarded-proto') && req.get('x-forwarded-host') ? `${req.get('x-forwarded-proto')}://${req.get('x-forwarded-host')}` : `${req.protocol}://${req.get('host')}`);
      // Note: We use a modified generic email sender or adapt the existing one.
      // Since sendPasswordResetEmail takes user object, we can pass staff and a flag, or just use it.
      // The emailService might need a small tweak to point to /portal/reset-password
      // We will pass the url directly if needed, or assume emailService uses generic url.
      // Let's assume we modify emailService to accept an explicit reset link.
      const resetLink = `${origin}/portal/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(staff, resetToken, origin, resetLink);
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'If that email exists and has portal access, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/portal/reset-password — Set New Password
// ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' 
      });
    }

    const staff = await Staff.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!staff) {
      return res.status(400).json({ success: false, message: 'Token invalid or expired' });
    }

    staff.portalPassword = password;
    staff.passwordResetToken = undefined;
    staff.passwordResetExpires = undefined;
    staff.mustChangePassword = false; // They just set it
    await staff.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/portal/me — Get Profile
// ─────────────────────────────────────────────────────────────
router.get('/me', authStaff, async (req, res) => {
  res.json({
    success: true,
    staff: {
      id: req.staff._id,
      fullName: req.staff.fullName,
      email: req.staff.email,
      phone: req.staff.phone,
      employeeId: req.staff.employeeId,
      designation: req.staff.designation,
      department: req.staff.department,
      type: req.staff.type,
      joiningDate: req.staff.joiningDate,
      pfNumber: req.staff.pfNumber,
      overtimeEligible: req.staff.overtimeEligible || false,
      financials: req.staff.financials,
      salaryDetails: req.staff.salaryDetails,
      leaveBalance: req.staff.leaveBalance,
      companyName: req.staff.user?.companyName,
      companyLogo: req.staff.user?.companyLogo,
    }
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /api/portal/me — Update Profile (Limited fields)
// ─────────────────────────────────────────────────────────────
router.put('/me', authStaff, async (req, res) => {
  try {
    const { phone } = req.body; // Address is not in current model, so just phone for now
    
    if (phone !== undefined) req.staff.phone = phone;
    // Add other editable fields if schema gets updated
    
    await req.staff.save();
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/portal/payslips — Get Staff's Pushed Payslips (Last 3 Months)
// ─────────────────────────────────────────────────────────────
router.get('/payslips', authStaff, async (req, res) => {
  try {
    const { search } = req.query;
    
    // Filter for last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const filter = {
      employeeId: req.staff.employeeId,
      user: req.staff.user._id,
      isPushedToPortal: true,
      createdAt: { $gte: threeMonthsAgo }
    };

    if (search) {
      filter.$or = [
        { month: { $regex: search, $options: 'i' } },
        { year: parseInt(search) || 0 }
      ];
    }

    const payslips = await Payslip.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: payslips });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payslips' });
  }
});

// We need to import Payslip model here if not available
const Payslip = require('../models/Payslip');

module.exports = { router, authStaff };
