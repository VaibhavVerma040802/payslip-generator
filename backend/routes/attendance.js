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
    const dayOfWeek = new Date().getUTCDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Block weekend punch-in unless staff is overtime-eligible
    if (isWeekend && !req.staff.overtimeEligible) {
      return res.status(403).json({
        success: false,
        message: 'Today is a weekend. You are not authorised to work on weekends. Please contact your administrator.'
      });
    }

    let attendance = await Attendance.findOne({ staff: req.staff._id, date: today });
    if (attendance) {
      return res.status(400).json({ success: false, message: 'Already punched in for today' });
    }

    attendance = new Attendance({
      staff: req.staff._id,
      admin: req.staff.user._id,
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
    const dayOfWeek = new Date().getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && !req.staff.overtimeEligible) {
      return res.status(403).json({
        success: false,
        message: 'Weekend punch-out is not permitted for your account.'
      });
    }

    const attendance = await Attendance.findOne({ staff: req.staff._id, date: today });
    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No punch-in record found for today' });
    }
    if (attendance.punchOut) {
      return res.status(400).json({ success: false, message: 'Already punched out for today' });
    }

    attendance.punchOut = new Date();
    const durationMs = attendance.punchOut - attendance.punchIn;
    const durationHours = durationMs / (1000 * 60 * 60);
    attendance.totalHours = parseFloat(durationHours.toFixed(2));

    if (attendance.totalHours > 8.5) {
      let ot = attendance.totalHours - 8.5;
      attendance.overtimeHours = parseFloat(Math.min(ot, 4.0).toFixed(2));
    } else {
      attendance.overtimeHours = 0;
    }

    attendance.status = attendance.totalHours > 16 ? 'flagged' : 'complete';
    if (attendance.totalHours > 16) {
      attendance.notes = 'System: Shift duration exceeds 16 hours. Requires admin review.';
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

// GET /api/attendance/active — Returns today's open shift (punched in but not out)
router.get('/active', authStaff, async (req, res) => {
  try {
    const today = getStartOfDay();
    const attendance = await Attendance.findOne({
      staff: req.staff._id,
      date: today,
      punchOut: { $exists: false } // Only return if not punched out yet
    });
    res.json({ success: true, activeShift: attendance || null });
  } catch (err) {
    console.error('Active shift error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch active shift' });
  }
});

// GET /api/attendance/history (Staff View) — supports ?month=&year= or defaults to last 30 days
router.get('/history', authStaff, async (req, res) => {
  try {
    let filter = { staff: req.staff._id };

    const { month, year } = req.query;
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(Date.UTC(y, m - 1, 1));
      const endDate = new Date(Date.UTC(y, m, 1)); // First day of next month
      filter.date = { $gte: startDate, $lt: endDate };
    } else {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 30);
      filter.date = { $gte: limitDate };
    }

    const history = await Attendance.find(filter).sort({ date: -1 });

    // Calculate summary stats for this period
    const presentDays = history.filter(r => r.status === 'complete' || r.totalHours > 0).length;
    const totalHours = history.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const totalOT = history.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const flaggedCount = history.filter(r => r.status === 'flagged').length;
    const avgHours = presentDays > 0 ? totalHours / presentDays : 0;

    res.json({
      success: true,
      history,
      summary: { presentDays, totalHours: parseFloat(totalHours.toFixed(2)), avgHours: parseFloat(avgHours.toFixed(2)), totalOT: parseFloat(totalOT.toFixed(2)), flaggedCount }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// GET /api/attendance/weekly?date= — Weekly summary for a specific week
router.get('/weekly', authStaff, async (req, res) => {
  try {
    const refDate = req.query.date ? new Date(req.query.date) : new Date();
    const day = refDate.getUTCDay() || 7; // Mon=1...Sun=7
    const monday = new Date(refDate);
    monday.setUTCDate(refDate.getUTCDate() - day + 1);
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 7);

    const weekRecords = await Attendance.find({
      staff: req.staff._id,
      date: { $gte: monday, $lt: sunday }
    });

    const totalHours = weekRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const totalOT = weekRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const presentDays = weekRecords.filter(r => r.status === 'complete' || r.totalHours > 0).length;
    const flaggedCount = weekRecords.filter(r => r.status === 'flagged').length;
    const avgHours = presentDays > 0 ? totalHours / presentDays : 0;

    res.json({
      success: true,
      summary: {
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalOT: parseFloat(totalOT.toFixed(2)),
        presentDays,
        flaggedCount,
        avgHours: parseFloat(avgHours.toFixed(2)),
        weekStart: monday.toISOString(),
      }
    });
  } catch (err) {
    console.error('Weekly summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch weekly summary' });
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
