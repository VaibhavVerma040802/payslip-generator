const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const { auth: protect } = require('./auth');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const { logActivity } = require('../utils/logger');
router.get('/', protect, async (req, res) => {
  try {
    const staff = await Staff.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new staff
router.post('/', protect, async (req, res) => {
  try {
    const staff = new Staff({
      ...req.body,
      user: req.user._id,
    });
    await staff.save();

    await logActivity(req.user._id, 'STAFF_CREATED', `Added new staff: ${staff.fullName} (${staff.employeeId})`, { staffId: staff._id });

    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get a specific staff member
router.get('/:id', protect, async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, user: req.user._id });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update a staff member
router.put('/:id', protect, async (req, res) => {
  try {
    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedStaff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    await logActivity(req.user._id, 'STAFF_UPDATED', `Updated details for ${updatedStaff.fullName}`, { staffId: updatedStaff._id });

    res.json({ success: true, data: updatedStaff });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete a staff member
router.delete('/:id', protect, async (req, res) => {
  try {
    const deletedStaff = await Staff.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deletedStaff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    await logActivity(req.user._id, 'STAFF_DELETED', `Deleted staff: ${deletedStaff.fullName}`, { staffId: deletedStaff._id });

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/staff/:id/provision-portal — Admin Provisions Staff Portal
// ─────────────────────────────────────────────────────────────
router.post('/:id/provision-portal', protect, async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, user: req.user._id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    // Generate a temporary 10-char password
    const tempPassword = crypto.randomBytes(5).toString('hex');
    
    staff.portalPassword = tempPassword;
    staff.isPortalEnabled = true;
    staff.mustChangePassword = true;
    staff.loginAttempts = 0;
    staff.lockUntil = undefined;
    
    await staff.save();

    // Send email to staff.email with tempPassword
    try {
      if (emailService && emailService.sendStaffProvisionEmail) {
        // Build base URL: prefer explicit env var, then forwarded host, then request host
        const baseUrl = process.env.FRONTEND_URL ||
          (req.get('x-forwarded-proto') && req.get('x-forwarded-host')
            ? `${req.get('x-forwarded-proto')}://${req.get('x-forwarded-host')}`
            : `${req.protocol}://${req.get('host')}`
          );
        // Always use the explicit staff portal login path
        const loginLink = `${baseUrl.replace(/\/$/, '')}/portal/login`;
        console.log(`📧 Staff portal login link: ${loginLink}`);
        await emailService.sendStaffProvisionEmail(staff, tempPassword, loginLink);
      } else {
        console.warn('⚠️ emailService.sendStaffProvisionEmail is not defined. Temp password is:', tempPassword);
      }
    } catch (emailErr) {
      console.error('📧 Failed to send provision email:', emailErr);
      // Still return success but warn admin
      return res.json({ 
        success: true, 
        message: 'Portal provisioned successfully, but email failed to send. Please share the password manually.',
        tempPassword // Provide it in response ONLY if email fails, as fallback for the admin.
      });
    }

    await staff.save();

    await logActivity(req.user._id, 'PORTAL_ACCESS_GRANTED', `Granted portal access to ${staff.fullName}`, { staffId: staff._id });

    res.json({ success: true, message: 'Portal access granted and credentials emailed.' });
  } catch (err) {
    console.error('Provisioning error:', err);
    res.status(500).json({ success: false, message: 'Server error provisioning portal' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/staff/:id/revoke-portal — Admin Revokes Staff Portal
// ─────────────────────────────────────────────────────────────
router.delete('/:id/revoke-portal', protect, async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, user: req.user._id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    staff.isPortalEnabled = false;
    staff.portalPassword = undefined;
    
    await staff.save();

    await logActivity(req.user._id, 'PORTAL_ACCESS_REVOKED', `Revoked portal access for ${staff.fullName}`, { staffId: staff._id });

    res.json({ success: true, message: 'Portal access revoked.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error revoking portal' });
  }
});

module.exports = router;
