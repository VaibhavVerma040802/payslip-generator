const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authStaff } = require('./staffPortal');
const { auth: authAdmin } = require('./auth');

// Helper to get start of day in UTC for querying
const getStartOfDay = (dateString = null) => {
  const date = dateString ? new Date(dateString) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// ─────────────────────────────────────────────────────────────
// STAFF ENDPOINTS (Using authStaff middleware)
// ─────────────────────────────────────────────────────────────

// POST /api/attendance/punch-in
router.post('/punch-in', authStaff, async (req, res) => {
  try {
    const today = getStartOfDay();
    
    let attendance = await Attendance.findOne({
      staff: req.staff._id,
      date: today
    });

    if (attendance) {
      return res.status(400).json({ success: false, message: 'Already punched in for today' });
    }

    // Working time starts at 10:30 AM (could log late arrival if needed)
    
    attendance = new Attendance({
      staff: req.staff._id,
      admin: req.staff.user._id, // Owner of the company
      date: today,
      punchIn: new Date(),
      status: 'incomplete'
    });

    await attendance.save();

    res.json({ success: true, message: 'Punched in successfully', attendance });
  } catch (err) {
    console.error('Punch in error:', err);
    res.status(500).json({ success: false, message: 'Failed to punch in' });
  }
});

// POST /api/attendance/punch-out
router.post('/punch-out', authStaff, async (req, res) => {
  try {
    const today = getStartOfDay();
    
    const attendance = await Attendance.findOne({
      staff: req.staff._id,
      date: today
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No punch-in record found for today' });
    }
    
    if (attendance.punchOut) {
      return res.status(400).json({ success: false, message: 'Already punched out for today' });
    }

    attendance.punchOut = new Date();
    
    // Calculate hours
    const durationMs = attendance.punchOut - attendance.punchIn;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    attendance.totalHours = parseFloat(durationHours.toFixed(2));
    
    // 8.5 standard hours, max 4 hours overtime
    if (attendance.totalHours > 8.5) {
      let ot = attendance.totalHours - 8.5;
      attendance.overtimeHours = parseFloat(Math.min(ot, 4.0).toFixed(2));
    } else {
      attendance.overtimeHours = 0;
    }

    // Flag overnight or extreme hours (e.g. > 16)
    if (attendance.totalHours > 16) {
      attendance.status = 'flagged';
      attendance.notes = 'System: Shift duration exceeds 16 hours. Requires admin review.';
    } else {
      attendance.status = 'complete';
    }

    await attendance.save();

    res.json({ success: true, message: 'Punched out successfully', attendance });
  } catch (err) {
    console.error('Punch out error:', err);
    res.status(500).json({ success: false, message: 'Failed to punch out' });
  }
});

// GET /api/attendance/today
router.get('/today', authStaff, async (req, res) => {
  try {
    const today = getStartOfDay();
    const attendance = await Attendance.findOne({
      staff: req.staff._id,
      date: today
    });
    
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch record' });
  }
});

// GET /api/attendance/history (Staff View)
router.get('/history', authStaff, async (req, res) => {
  try {
    // Return last 30 days
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 30);
    
    const history = await Attendance.find({
      staff: req.staff._id,
      date: { $gte: limitDate }
    }).sort({ date: -1 });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// GET /api/attendance/summary (Staff View)
router.get('/summary', authStaff, async (req, res) => {
  try {
    // Current week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // Make Sunday = 7
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - dayOfWeek + 1);
    monday.setUTCHours(0,0,0,0);

    const weekRecords = await Attendance.find({
      staff: req.staff._id,
      date: { $gte: monday },
      status: 'complete'
    });

    let totalWeekHours = 0;
    weekRecords.forEach(r => totalWeekHours += r.totalHours);

    const validDays = weekRecords.length;
    const weeklyAverage = validDays > 0 ? parseFloat((totalWeekHours / validDays).toFixed(2)) : 0;

    res.json({
      success: true,
      summary: {
        totalWeekHours: parseFloat(totalWeekHours.toFixed(2)),
        validDays,
        weeklyAverage
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Using authAdmin middleware)
// ─────────────────────────────────────────────────────────────

// GET /api/attendance/admin/staff/:staffId
router.get('/admin/staff/:staffId', authAdmin, async (req, res) => {
  try {
    const history = await Attendance.find({
      staff: req.params.staffId,
      admin: req.user._id
    }).sort({ date: -1 });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch staff attendance' });
  }
});

// PUT /api/attendance/admin/:id
router.put('/admin/:id', authAdmin, async (req, res) => {
  try {
    const { punchIn, punchOut, notes, status } = req.body;
    
    const attendance = await Attendance.findOne({
      _id: req.params.id,
      admin: req.user._id
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (punchIn) attendance.punchIn = new Date(punchIn);
    if (punchOut) attendance.punchOut = new Date(punchOut);
    
    if (attendance.punchIn && attendance.punchOut) {
      const durationMs = attendance.punchOut - attendance.punchIn;
      attendance.totalHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
      
      if (attendance.totalHours > 8.5) {
        let ot = attendance.totalHours - 8.5;
        attendance.overtimeHours = parseFloat(Math.min(ot, 4.0).toFixed(2));
      } else {
        attendance.overtimeHours = 0;
      }
    }

    if (notes !== undefined) attendance.notes = notes;
    if (status) attendance.status = status;

    await attendance.save();

    res.json({ success: true, message: 'Record updated', attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update record' });
  }
});

module.exports = router;
