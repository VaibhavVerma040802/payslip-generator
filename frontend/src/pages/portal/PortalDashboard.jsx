import { useState, useEffect, useCallback } from 'react'
import { LogIn, LogOut, Clock, Calendar as CalendarIcon, AlertCircle, Loader2, Timer, Coffee } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'
import { motion } from 'framer-motion'
import { useStaffPortal } from '../../context/StaffPortalContext'

export default function PortalDashboard() {
  const { staffUser } = useStaffPortal()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeShift, setActiveShift] = useState(null) // null = not punched in
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [leaveHistory, setLeaveHistory] = useState([])

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch current shift state on mount
  const fetchActiveShift = useCallback(async () => {
    try {
      const res = await api.get('/attendance/active')
      setActiveShift(res.data.activeShift || null)
    } catch (err) {
      console.error('Failed to fetch active shift:', err)
      setActiveShift(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveShift()
    fetchLeaveHistory()
  }, [fetchActiveShift])

  const fetchLeaveHistory = async () => {
    try {
      const res = await api.get('/leaves/my-requests')
      setLeaveHistory(res.data.data)
    } catch (err) {
      console.error('Failed to fetch leave history')
    }
  }

  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [leaveData, setLeaveData] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' })

  const handlePunch = async (type) => {
    setActionLoading(true)
    try {
      // Capture Geolocation
      let coords = null
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
          })
          coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        } catch (geoErr) {
          console.warn('Geolocation failed:', geoErr)
        }
      }

      const endpoint = type === 'in' ? '/attendance/punch-in' : '/attendance/punch-out'
      const res = await api.post(endpoint, coords || {})
      toast.success(res.data.message)
      await fetchActiveShift()
    } catch (err) {
      toast.error(err.message || `Failed to punch ${type}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyLeave = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await api.post('/leaves/apply', leaveData)
      toast.success('Leave request submitted')
      setLeaveModalOpen(false)
      setLeaveData({ type: 'Casual', startDate: '', endDate: '', reason: '' })
      fetchLeaveHistory()
    } catch (err) {
      toast.error(err.message || 'Failed to submit leave')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDuration = (start) => {
    const diff = Math.max(0, Math.floor((new Date() - new Date(start)) / 1000))
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    const s = diff % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const dayOfWeek = new Date().getDay() // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isPunchedIn = Boolean(activeShift && !activeShift.punchOut)

  // Weekend + not overtime-eligible = show day off card
  const isOvertimeEligible = staffUser?.overtimeEligible || false
  const isOffDay = isWeekend && !isOvertimeEligible

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
      <Loader2 size={40} className="animate-spin text-muted" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 8 }}>
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ready to track your progress today?</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLeaveModalOpen(true)}
          style={{
            padding: '12px 24px', borderRadius: 6, background: 'var(--primary)', color: 'white',
            border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(88, 131, 59, 0.15)'
          }}
        >
          <CalendarIcon size={18} /> Apply for Leave
        </motion.button>
      </header>

      {/* Weekend Day-Off Banner */}
      {isOffDay && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 32, padding: 24, borderRadius: 12,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', gap: 20, color: 'white'
          }}
        >
          <Coffee size={40} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {dayOfWeek === 0 ? 'Sunday' : 'Saturday'} — Your Day Off 🎉
            </div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              Attendance tracking is paused for weekends. Relax and recharge! If you believe you should have weekend access, contact your administrator.
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* Live Clock Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 20 }}>
            <Clock size={32} />
          </div>
          <div style={{ fontSize: 48, fontWeight: 600, fontFamily: 'var(--font-stack)', color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontWeight: 500 }}>
            <CalendarIcon size={16} />
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </motion.div>

        {/* Punch Action Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: 18 }}>Shift Status</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
                {isPunchedIn ? 'Currently PUNCHED IN' : (activeShift?.workStatus ? `Today: ${activeShift.workStatus}` : 'Currently PUNCHED OUT')}
              </p>
            </div>
            <div
              className={`badge ${
                isPunchedIn ? 'badge-emerald' : 
                activeShift?.workStatus === 'Full Day' ? 'badge-emerald' :
                activeShift?.workStatus === 'Half Day' ? 'badge-navy' :
                activeShift?.workStatus === 'LOP' ? 'badge-red' : 'badge-navy'
              }`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: isPunchedIn ? 'var(--primary)' : undefined,
                color: '#ffffff',
              }}
            >
              {isPunchedIn && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'white', display: 'inline-block',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.4)',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
              {isPunchedIn ? 'ACTIVE' : (activeShift?.workStatus ? activeShift.workStatus.toUpperCase() : 'OFF-DUTY')}
            </div>
          </div>

          {/* Session timer — only visible when punched in */}
          {isPunchedIn && activeShift?.punchIn && (
            <div style={{ marginBottom: 32, padding: 16, background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
                <Timer size={16} /> SESSION DURATION
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {formatDuration(activeShift.punchIn)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Punched in at {new Date(activeShift.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
          )}

          {/* The single punch button — toggles between Punch In and Punch Out */}
          {!isPunchedIn ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePunch('in')}
              disabled={actionLoading}
              className="btn-primary"
              style={{ width: '100%', height: 56, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              Punch In
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePunch('out')}
              disabled={actionLoading}
              className="btn-primary"
              style={{ 
                width: '100%', height: 56, 
                background: '#ef4444', 
                fontSize: 16, 
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' 
              }}
            >
              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
              Punch Out
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Work Policy Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 24 }} className="card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(88, 131, 59, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
            <AlertCircle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: 15 }}>Work Hours Policy</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                • <strong>Start Time:</strong> 10:30 AM <br/>
                • <strong>Half Day Threshold:</strong> Punch-in after 11:00 AM <br/>
                • <strong>Overtime:</strong> Starts after 8.5h (Max 4h)
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                • <strong>Full Day:</strong> 8.5+ hours logged <br/>
                • <strong>Half Day:</strong> 4 to 7.9 hours logged <br/>
                • <strong>Absent/LOP:</strong> Less than 4 hours logged
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Leave History Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, color: 'var(--primary)', margin: 0 }}>My Leave Requests</h2>
          <div className="badge badge-emerald">{leaveHistory.length} Total</div>
        </div>
        
        {leaveHistory.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <CalendarIcon size={40} style={{ marginBottom: 16, opacity: 0.2 }} />
            <p>You haven't submitted any leave requests yet.</p>
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(88, 131, 59, 0.05)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>Type</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>Period</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>Reason</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--primary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveHistory.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{req.type}</td>
                    <td style={{ padding: '16px 24px' }}>
                      {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${
                        req.status === 'Approved' ? 'badge-emerald' : 
                        req.status === 'Rejected' ? 'badge-red' : 
                        'badge-navy'
                      }`}>
                        {req.status}
                      </span>
                      {req.adminNotes && (
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>Note: {req.adminNotes}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Leave Request Modal */}
      {leaveModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 26, 26, 0.6)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 24, color: 'var(--primary)', marginBottom: 24 }}>Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">LEAVE TYPE</label>
                <select
                  required
                  value={leaveData.type}
                  onChange={e => setLeaveData({ ...leaveData, type: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  <option value="Casual">Paid Casual Leave</option>
                  <option value="Sick">Paid Sick Leave</option>
                  <option value="Custom">Custom Leave</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label">START DATE</label>
                  <input
                    type="date" required
                    value={leaveData.startDate}
                    onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="label">END DATE</label>
                  <input
                    type="date" required
                    value={leaveData.endDate}
                    onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <label className="label">REASON</label>
                <textarea
                  required rows="3"
                  value={leaveData.reason}
                  onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}
                  placeholder="Explain your leave requirement..."
                  className="input-field"
                  style={{ width: '100%', height: 'auto', padding: '12px', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, height: 48 }}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="btn-primary"
                  style={{ flex: 2, height: 48 }}
                >
                  {actionLoading ? <Loader2 size={20} className="animate-spin" /> : 'Submit Application'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
