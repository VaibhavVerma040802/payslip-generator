const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Notification = require('../models/Notification');
const Staff = require('../models/Staff');
const { authStaff } = require('./staffPortal');
const { auth: authAdmin } = require('./auth');

// ─────────────────────────────────────────────────────────────
// STAFF ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/leaves/apply — Staff applies for leave
router.post('/apply', authStaff, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    
    // Validate balance if needed (optional: could allow applying but admin sees over-quota)
    // For now, let's just create the request.
    
    const leave = new LeaveRequest({
      staff: req.staff._id,
      admin: req.staff.user._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'Pending'
    });
    
    await leave.save();
    
    // Create Notification for Admin
    const notification = new Notification({
      admin: req.staff.user._id,
      staff: req.staff._id,
      type: 'LEAVE_REQUEST',
      referenceId: leave._id,
      message: `${req.staff.fullName} has applied for ${type} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`
    });
    await notification.save();
    
    res.status(201).json({ success: true, message: 'Leave request submitted successfully', leave });
  } catch (err) {
    console.error('Leave apply error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit leave request' });
  }
});

// GET /api/leaves/my-requests — Staff views their requests
router.get('/my-requests', authStaff, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ staff: req.staff._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// GET /api/leaves/notifications — Staff views their notifications
router.get('/notifications', authStaff, async (req, res) => {
  try {
    const notifications = await Notification.find({ staff: req.staff._id, recipientType: 'staff' })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/leaves/admin/pending — Admin views pending requests
router.get('/admin/pending', authAdmin, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ admin: req.user._id, status: 'Pending' })
      .populate('staff', 'fullName employeeId leaveBalance')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
  }
});

// POST /api/leaves/admin/respond — Admin Approves/Rejects
router.post('/admin/respond', authAdmin, async (req, res) => {
  try {
    const { id, status, adminNotes } = req.body; // status: 'Approved' or 'Rejected'
    
    const leave = await LeaveRequest.findOne({ _id: id, admin: req.user._id });
    if (!leave) return res.status(404).json({ success: false, message: 'Request not found' });
    
    leave.status = status;
    leave.adminNotes = adminNotes;
    await leave.save();
    
    // If approved, deduct from balance if applicable
    if (status === 'Approved') {
      const staff = await Staff.findById(leave.staff);
      const days = Math.ceil((leave.endDate - leave.startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      if (leave.type === 'Casual') {
        staff.leaveBalance.casual -= days;
      } else if (leave.type === 'Sick') {
        staff.leaveBalance.sick -= days;
      }
      // Custom leave doesn't necessarily deduct from standard quota but could be tracked elsewhere
      
      await staff.save();
    }

    // Mark related notifications as read
    await Notification.updateMany({ referenceId: leave._id, recipientType: 'admin' }, { $set: { isRead: true } });
    
    // Create Notification for Staff
    const staffNotification = new Notification({
      admin: req.user._id,
      staff: leave.staff,
      recipientType: 'staff',
      type: 'LEAVE_REQUEST',
      referenceId: leave._id,
      message: `Your leave request for ${leave.type} (${new Date(leave.startDate).toLocaleDateString()}) has been ${status.toUpperCase()}. ${adminNotes ? 'Note: ' + adminNotes : ''}`
    });
    await staffNotification.save();

    await logActivity(req.user._id, 'LEAVE_RESPONSE', `Responded ${status} to ${leave.type} leave for staff ${leave.staff}`, { leaveId: leave._id });
    
    res.json({ success: true, message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (err) {
    console.error('Leave respond error:', err);
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});

// GET /api/leaves/admin/notifications — Fetch admin notifications
router.get('/admin/notifications', authAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find({ admin: req.user._id, isRead: false })
      .populate('staff', 'fullName employeeId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

module.exports = router;
