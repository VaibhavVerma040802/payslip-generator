const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const { authStaff } = require('./staffPortal');
const { auth: authAdmin } = require('./auth');
const { logActivity } = require('../utils/logger');
const { sendPunchOutReminderEmail } = require('../utils/emailService');

// Helper to get start of day in UTC for querying
const getStartOfDay = (dateString = null) => {
  const date = dateString ? new Date(dateString) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// ─────────────────────────────────────────────────────────────
// STAFF ENDPOINTS (Using authStaff middleware)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Using authAdmin middleware)
// ─────────────────────────────────────────────────────────────

// GET /api/attendance/admin/active — Count of staff currently punched in today
router.get('/admin/active', authAdmin, async (req, res) => {
  try {
    const today = getStartOfDay();
    const activeCount = await Attendance.countDocuments({
      admin: req.user._id,
      date: today,
      punchOut: { $exists: false }
    });

    res.json({ success: true, activeCount });
  } catch (err) {
    console.error('Active staff count error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch active staff count' });
  }
});

// GET /api/attendance/admin/monthly?month=&year= — All records for a month across all staff
router.get('/admin/monthly', authAdmin, async (req, res) => {
  try {
    const m = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const y = parseInt(req.query.year)  || new Date().getFullYear();
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate   = new Date(Date.UTC(y, m, 1));

    const records = await Attendance.find({
      admin: req.user._id,
      date: { $gte: startDate, $lt: endDate }
    })
      .populate('staff', 'fullName employeeId designation department')
      .sort({ date: -1 })
      .lean();

    res.json({ success: true, data: records });
  } catch (err) {
    console.error('Monthly attendance error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly attendance' });
  }
});

// GET /api/attendance/admin/today-punchins — All today's punch-in records with staff details
router.get('/admin/today-punchins', authAdmin, async (req, res) => {
  try {
    const today = getStartOfDay();
    const records = await Attendance.find({
      admin: req.user._id,
      date: today
    })
      .populate('staff', 'fullName employeeId designation department')
      .sort({ punchIn: -1 })
      .lean();

    res.json({ success: true, data: records });
  } catch (err) {
    console.error('Today punch-ins error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch today\'s punch-ins' });
  }
});

// POST /api/attendance/punch-in
router.post('/punch-in', authStaff, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const today = getStartOfDay();
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat
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

    // Work criteria: If punch in after 11:00 AM, mark as Half Day
    // Local time check
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let initialWorkStatus = 'Full Day';
    
    if (currentHour > 11 || (currentHour === 11 && currentMinute > 0)) {
      initialWorkStatus = 'Half Day';
    }

    attendance = new Attendance({
      staff: req.staff._id,
      admin: req.staff.user._id,
      date: today,
      punchIn: now,
      status: 'incomplete',
      workStatus: initialWorkStatus,
      locationIn: lat && lng ? { lat, lng } : undefined
    });
    
    await attendance.save();
    res.json({ success: true, message: `Punched in successfully. Status: ${initialWorkStatus}`, attendance });
  } catch (err) {
    console.error('Punch in error:', err);
    res.status(500).json({ success: false, message: 'Failed to punch in' });
  }
});

// POST /api/attendance/punch-out
router.post('/punch-out', authStaff, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const today = getStartOfDay();
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
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

    attendance.punchOut = now;
    attendance.locationOut = lat && lng ? { lat, lng } : undefined;
    
    const durationMs = attendance.punchOut - attendance.punchIn;
    const durationHours = durationMs / (1000 * 60 * 60);
    attendance.totalHours = parseFloat(durationHours.toFixed(2));

    // Refined Work Criteria Logic
    // Absent/LOP: < 4 hours
    // Half Day: 4 to 7.9 hours
    // Full Day: 8.5+ hours
    // Overtime: Full Day + extra working (max 4h)
    
    let finalWorkStatus = attendance.workStatus; // Start with what was set at punch-in (Full Day or Half Day)

    if (attendance.totalHours < 4) {
      finalWorkStatus = 'LOP';
    } else if (attendance.totalHours >= 4 && attendance.totalHours < 8.0) {
      finalWorkStatus = 'Half Day';
    } else if (attendance.totalHours >= 8.5) {
      // If they punched in before 11:00 AM, they stay Full Day. 
      // If they punched in after 11:00 AM, they stay Half Day (already set at punch-in).
      if (attendance.workStatus === 'Full Day') {
        finalWorkStatus = 'Full Day';
      }
    } else {
      // 8.0 to 8.4 range - default to Half Day or maintain Half Day
      finalWorkStatus = 'Half Day';
    }

    attendance.workStatus = finalWorkStatus;

    // Overtime Calculation: starts after 8.5h, max 4h (12.5h total cap)
    if (attendance.totalHours > 8.5) {
      let ot = attendance.totalHours - 8.5;
      attendance.overtimeHours = parseFloat(Math.min(ot, 4.0).toFixed(2));
    } else {
      attendance.overtimeHours = 0;
    }

    attendance.status = attendance.totalHours > 12.5 ? 'flagged' : 'complete';
    if (attendance.totalHours > 12.5) {
      attendance.notes = `System: Shift duration (${attendance.totalHours}h) exceeds the 12.5h limit (Full Day + 4h OT). Flagged for review.`;
    }

    await attendance.save();
    await logActivity(req.staff.user._id, 'PUNCH_OUT', `Punched out for ${req.staff.fullName} (Status: ${finalWorkStatus})`, { attendanceId: attendance._id });
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

    const history = await Attendance.find(filter).sort({ date: -1 }).lean();

    // Map history to handle real-time "ACTIVE" status
    const mappedHistory = history.map(record => {
      if (!record.punchOut) {
        return { ...record, workStatus: 'Active' };
      }
      return record;
    });

    // Calculate summary stats for this period
    const presentDays = history.filter(r => r.status === 'complete' || r.totalHours > 0).length;
    const totalHours = history.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const totalOT = history.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const flaggedCount = history.filter(r => r.status === 'flagged').length;
    const avgHours = presentDays > 0 ? totalHours / presentDays : 0;

    res.json({
      success: true,
      history: mappedHistory,
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

// GET /api/attendance/admin/pending — Get all flagged or long-incomplete records for dashboard
router.get('/admin/pending', authAdmin, async (req, res) => {
  try {
    const pending = await Attendance.find({
      admin: req.user._id,
      $or: [
        { status: 'flagged' },
        { status: 'incomplete', date: { $lt: getStartOfDay() } } // Incomplete from previous days
      ]
    }).populate('staff', 'fullName employeeId').sort({ date: -1 });

    res.json({ success: true, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/admin/force-punch-out — Close all "incomplete" shifts from previous days
router.get('/admin/export-csv', authAdmin, async (req, res) => {
  try {
    const records = await Attendance.find({ admin: req.user._id })
      .populate('staff', 'fullName employeeId')
      .sort({ date: -1 });

    let csv = 'Employee,ID,Date,Punch In,Punch Out,Total Hours,Overtime,Status\n';
    records.forEach(r => {
      const date = new Date(r.date).toLocaleDateString('en-GB'); // DD/MM/YYYY
      const formatTime = (dt) => {
        if (!dt) return 'N/A';
        const d = new Date(dt);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/,/g, '');
      };
      const punchIn = formatTime(r.punchIn);
      const punchOut = formatTime(r.punchOut);
      csv += `"${r.staff?.fullName || 'N/A'}","${r.staff?.employeeId || 'N/A'}","${date}","${punchIn}","${punchOut}",${r.totalHours || 0},${r.overtimeHours || 0},"${r.status}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`Attendance_Export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// POST /api/attendance/admin/force-punch-out — Close all "incomplete" shifts from previous days
router.post('/admin/force-punch-out', authAdmin, async (req, res) => {
  try {
    const today = getStartOfDay();
    const staleShifts = await Attendance.find({ admin: req.user._id, status: 'incomplete', date: { $lt: today } });
    
    let modifiedCount = 0;
    for (const shift of staleShifts) {
      if (shift.punchIn) {
        // Set punch out to 10 hours after punch in
        shift.punchOut = new Date(shift.punchIn.getTime() + 10 * 60 * 60 * 1000);
        shift.totalHours = 10;
        // If > 8.5, then OT is 1.5
        shift.overtimeHours = 1.5; 
        shift.workStatus = 'Full Day';
      }
      shift.status = 'flagged';
      shift.notes = (shift.notes ? shift.notes + ' | ' : '') + 'System: Force closed stale shift from previous day.';
      await shift.save();
      modifiedCount++;
    }

    if (modifiedCount > 0) {
      await logActivity(req.user._id, 'FORCE_PUNCH_OUT', `Bulk closed ${modifiedCount} stale attendance shifts.`);
    }

    res.json({ success: true, message: `Closed ${modifiedCount} stale shifts. They are now flagged for review.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// CRON JOBS / BACKGROUND TASKS
// ─────────────────────────────────────────────────────────────

// GET /api/attendance/cron/check-shifts
// Called by Vercel Cron periodically (e.g., every hour)
router.get('/cron/check-shifts', async (req, res) => {
  try {
    // 1. Force punch-out shifts > 10 hours
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const overdueShifts = await Attendance.find({
      status: 'incomplete',
      punchOut: { $exists: false },
      punchIn: { $lte: tenHoursAgo }
    }).populate('staff');

    for (const shift of overdueShifts) {
      shift.punchOut = new Date(shift.punchIn.getTime() + 10 * 60 * 60 * 1000);
      shift.totalHours = 10;
      shift.overtimeHours = 1.5;
      shift.workStatus = 'Full Day';
      shift.status = 'flagged';
      shift.notes = (shift.notes ? shift.notes + ' | ' : '') + 'System: Auto-closed after 10 hours maximum duration.';
      await shift.save();

      // Notify Staff about the auto-close
      if (shift.staff) {
        const notif = new Notification({
          admin: shift.admin,
          staff: shift.staff._id,
          recipientType: 'staff',
          type: 'ATTENDANCE_ALERT',
          referenceId: shift._id,
          message: `Your shift on ${shift.date.toLocaleDateString()} was automatically closed after 10 hours. Please review your attendance.`
        });
        await notif.save();
      }
    }

    // 2. Remind shifts > 8.5 hours but < 10 hours
    const eightHalfHoursAgo = new Date(Date.now() - 8.5 * 60 * 60 * 1000);
    const reminderShifts = await Attendance.find({
      status: 'incomplete',
      punchOut: { $exists: false },
      punchIn: { $gt: tenHoursAgo, $lte: eightHalfHoursAgo }
    }).populate('staff');

    for (const shift of reminderShifts) {
      // Check if we already reminded them for this shift
      const existingReminder = await Notification.findOne({
        staff: shift.staff._id,
        referenceId: shift._id,
        type: 'ATTENDANCE_ALERT'
      });

      if (!existingReminder && shift.staff && shift.staff.email) {
        // Send email
        const loginUrl = process.env.FRONTEND_URL || 'https://payslip-gen-rouge.vercel.app';
        await sendPunchOutReminderEmail(shift.staff, loginUrl).catch(console.error);

        // Create notification
        const notif = new Notification({
          admin: shift.admin,
          staff: shift.staff._id,
          recipientType: 'staff',
          type: 'ATTENDANCE_ALERT',
          referenceId: shift._id,
          message: `Reminder: You have been punched in for over 8.5 hours. Please punch out if your workday is complete.`
        });
        await notif.save();
      }
    }

    res.json({ 
      success: true, 
      message: 'Cron executed successfully', 
      autoClosed: overdueShifts.length,
      remindersSent: reminderShifts.length 
    });
  } catch (err) {
    console.error('Cron job error:', err);
    res.status(500).json({ success: false, message: 'Cron job failed' });
  }
});

module.exports = router;
