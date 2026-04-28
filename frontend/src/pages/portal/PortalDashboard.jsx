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
      setLeaveHistory(res.data.data || [])
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

  const isOvertimeEligible = staffUser?.overtimeEligible || false
  const isOffDay = isWeekend && !isOvertimeEligible

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
      <Loader2 size={40} className="animate-spin text-muted" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
      <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', color: 'var(--primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}, {staffUser?.fullName?.split(' ')[0] || 'Member'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 16 }}>Ready to track your progress today?</p>
        </div>
        <button
          onClick={() => setLeaveModalOpen(true)}
          className="btn-primary"
          style={{ height: 48, padding: '0 28px', borderRadius: 14 }}
        >
          <CalendarIcon size={18} /> Apply for Leave
        </button>
      </header>

      {/* Weekend Day-Off Banner */}
      {isOffDay && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 40, padding: 32, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--bda-green-light) 100%)',
            display: 'flex', alignItems: 'center', gap: 24, color: 'white',
            boxShadow: '0 20px 40px -10px rgba(88, 131, 59, 0.3)'
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Coffee size={36} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.01em' }}>
              Happy {dayOfWeek === 0 ? 'Sunday' : 'Saturday'}!
            </div>
            <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 500, lineHeight: 1.6 }}>
              It's your scheduled day off. Attendance tracking is currently paused. Enjoy your time off and recharge for the week ahead!
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32, marginBottom: 48 }}>
        {/* Live Clock Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40, borderRadius: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 24 }}>
            <Clock size={36} />
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: 12 }}>
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontWeight: 700, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <CalendarIcon size={18} color="var(--primary)" />
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </motion.div>

        {/* Punch Action Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card glass" style={{ padding: 40, borderRadius: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: 20, fontWeight: 800 }}>Shift Status</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 15, fontWeight: 500 }}>
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
                display: 'flex', alignItems: 'center', gap: 8, height: 28, padding: '0 14px'
              }}
            >
              {isPunchedIn && (
                <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
              )}
              {isPunchedIn ? 'ACTIVE' : (activeShift?.workStatus ? activeShift.workStatus.toUpperCase() : 'OFF-DUTY')}
            </div>
          </div>

          {isPunchedIn && activeShift?.punchIn && (
            <div style={{ marginBottom: 32, padding: 24, background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--primary)', fontSize: 12, marginBottom: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Timer size={18} /> Session Duration
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {formatDuration(activeShift.punchIn)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>
                Punched in at {new Date(activeShift.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
          )}

          {!isPunchedIn ? (
            <button
              onClick={() => handlePunch('in')}
              disabled={actionLoading || isOffDay}
              className="btn-primary"
              style={{ width: '100%', height: 64, fontSize: 18, borderRadius: 16 }}
            >
              {actionLoading ? <Loader2 size={24} className="animate-spin" /> : <LogIn size={24} />}
              Punch In Now
            </button>
          ) : (
            <button
              onClick={() => handlePunch('out')}
              disabled={actionLoading}
              className="btn-primary"
              style={{ 
                width: '100%', height: 64, 
                background: '#dc2626', 
                color: 'white',
                fontSize: 18, 
                borderRadius: 16,
                boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.3)'
              }}
            >
              {actionLoading ? <Loader2 size={24} className="animate-spin" /> : <LogOut size={24} />}
              Punch Out Now
            </button>
          )}
        </motion.div>
      </div>

      {/* Policy Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card glass" style={{ borderRadius: 20, padding: 32 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(88, 131, 59, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
            <AlertCircle size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: 18, fontWeight: 800 }}>Attendance & Punctuality Policy</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 20 }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Timings</div>
                • Shift Start: <strong>10:30 AM</strong> <br/>
                • Late Entry: <strong>After 11:00 AM</strong> (Half Day) <br/>
                • Overtime: Starts after <strong>8.5h</strong> logged
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>
                <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Classification</div>
                • Full Day: <strong>8.5+ hours</strong> logged <br/>
                • Half Day: <strong>4 to 7.9 hours</strong> logged <br/>
                • Absent/LOP: Less than <strong>4 hours</strong> logged
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Leave History */}
      <div style={{ marginTop: 64 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 28, color: 'var(--primary)', margin: 0, letterSpacing: '-0.02em' }}>My Leave History</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Track your leave applications and status.</p>
          </div>
          <div className="badge badge-navy" style={{ padding: '6px 16px', borderRadius: 10 }}>{leaveHistory.length} Total Requests</div>
        </div>
        
        {leaveHistory.length === 0 ? (
          <div className="card glass" style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 24, border: '2px dashed var(--border)' }}>
            <CalendarIcon size={56} style={{ marginBottom: 24, color: 'var(--border)' }} />
            <h3 style={{ color: 'var(--primary)', marginBottom: 8 }}>No Leave Records</h3>
            <p>Your leave applications will be listed here once submitted.</p>
          </div>
        ) : (
          <div className="card glass" style={{ overflowX: 'auto', padding: 0, borderRadius: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveHistory.map((req) => (
                  <tr key={req._id}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{req.type}</td>
                    <td>
                      {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason}</td>
                    <td>
                      <span className={`badge ${
                        req.status === 'Approved' ? 'badge-emerald' : 
                        req.status === 'Rejected' ? 'badge-red' : 
                        'badge-navy'
                      }`}>
                        {req.status}
                      </span>
                      {req.adminNotes && (
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6, fontWeight: 500 }}>Note: {req.adminNotes}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      <AnimatePresence>
        {leaveModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 15, 10, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="card glass" style={{ width: '100%', maxWidth: 500, padding: 40, borderRadius: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 24, color: 'var(--primary)', margin: 0 }}>Apply for Leave</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Submit your request for administrative review.</p>
                </div>
                <button onClick={() => setLeaveModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--primary)' }}><LogOut size={20} style={{ transform: 'rotate(180deg)' }} /></button>
              </div>
              
              <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="label">LEAVE TYPE</label>
                  <select
                    required
                    value={leaveData.type}
                    onChange={e => setLeaveData({ ...leaveData, type: e.target.value })}
                    className="input-field glass"
                    style={{ width: '100%', height: 48 }}
                  >
                    <option value="Casual">Paid Casual Leave</option>
                    <option value="Sick">Paid Sick Leave</option>
                    <option value="Custom">Other Personal Leave</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label">START DATE</label>
                    <input
                      type="date" required
                      value={leaveData.startDate}
                      onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })}
                      className="input-field glass"
                      style={{ width: '100%', height: 48 }}
                    />
                  </div>
                  <div>
                    <label className="label">END DATE</label>
                    <input
                      type="date" required
                      value={leaveData.endDate}
                      onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })}
                      className="input-field glass"
                      style={{ width: '100%', height: 48 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">REASON FOR LEAVE</label>
                  <textarea
                    required rows="3"
                    value={leaveData.reason}
                    onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}
                    placeholder="Briefly describe the reason for your leave..."
                    className="input-field glass"
                    style={{ width: '100%', height: 'auto', padding: '16px', resize: 'none', minHeight: 100 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setLeaveModalOpen(false)}
                    className="btn-secondary"
                    style={{ flex: 1, height: 52, borderRadius: 14 }}
                  >
                    Discard
                  </button>
                  <button
                    type="submit" disabled={actionLoading}
                    className="btn-primary"
                    style={{ flex: 2, height: 52, borderRadius: 14 }}
                  >
                    {actionLoading ? <Loader2 size={20} className="animate-spin" /> : 'Submit Application'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .pulse-dot {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  )
}
