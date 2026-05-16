import { useState, useEffect, useCallback } from 'react'
import { LogIn, LogOut, Clock, Calendar as CalendarIcon, AlertCircle, Loader2, Timer, Coffee, Briefcase } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'
import { motion } from 'framer-motion'
import { useStaffPortal } from '../../context/StaffPortalContext'

export default function PortalDashboard() {
  const { staffUser } = useStaffPortal()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeShift, setActiveShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
  }, [fetchActiveShift])

  const handlePunch = async (type) => {
    setActionLoading(true)
    try {
      let coords = null
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
          )
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
      toast.error(err.response?.data?.message || `Failed to punch ${type}`)
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

  const hour = currentTime.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const dayOfWeek = new Date().getDay()
  const isPunchedIn = Boolean(activeShift && !activeShift.punchOut)

  // Effective working days: staff override → admin default → Mon-Fri fallback
  const effectiveWorkDays = (staffUser?.workingDays && staffUser.workingDays.length)
    ? staffUser.workingDays
    : (staffUser?.defaultWorkDays || [1, 2, 3, 4, 5])

  const isWorkDay = effectiveWorkDays.includes(dayOfWeek)
  const isOffDay  = !isWorkDay
  const isWeekendWork = !isOffDay && (dayOfWeek === 0 || dayOfWeek === 6) // Sat/Sun but assigned working
  const clientName = staffUser?.clientAssignment || ''

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{greeting}, {staffUser?.fullName?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: 4, fontSize: 14 }}>
          {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      {/* Off-day Banner */}
      {isOffDay && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24, padding: '20px 24px', borderRadius: 14, background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 18, color: 'white' }}>
          <Coffee size={36} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 3 }}>
              {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek]} — Your Day Off 🎉
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Attendance tracking is paused. Relax and recharge!</div>
          </div>
        </motion.div>
      )}

      {/* Weekend Work Banner */}
      {isWeekendWork && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24, padding: '20px 24px', borderRadius: 14, background: '#4f46e5', display: 'flex', alignItems: 'center', gap: 18, color: 'white' }}>
          <Briefcase size={36} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 3 }}>
              {dayOfWeek === 6 ? 'Saturday' : 'Sunday'} — Working Day
              {clientName && <span style={{ fontWeight: 500, fontSize: 14, marginLeft: 10, opacity: 0.88 }}>· {clientName}</span>}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>You're scheduled to work today. Punch in when you're ready!</div>
          </div>
        </motion.div>
      )}

      {/* Main Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>

        {/* Clock Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(88,131,59,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Clock size={28} color="var(--primary)" />
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 10 }}>
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
            <CalendarIcon size={14} />
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </motion.div>

        {/* Punch Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card" style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16, fontWeight: 700 }}>Shift Status</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                {isPunchedIn ? 'Currently punched in' : (activeShift?.workStatus ? `Today: ${activeShift.workStatus}` : 'Not punched in yet')}
              </p>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: isPunchedIn ? 'var(--primary)' : '#f1f5f9',
              color: isPunchedIn ? 'white' : 'var(--text-muted)'
            }}>
              {isPunchedIn && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse 1.5s infinite' }} />}
              {isPunchedIn ? 'ACTIVE' : (activeShift?.workStatus?.toUpperCase() || 'OFF-DUTY')}
            </span>
          </div>

          {isPunchedIn && activeShift?.punchIn && (
            <div style={{ marginBottom: 24, padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Timer size={14} /> Session Duration
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                {formatDuration(activeShift.punchIn)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Punched in at {new Date(activeShift.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
          )}

          {!isPunchedIn ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => handlePunch('in')} disabled={actionLoading} className="btn-primary"
              style={{ width: '100%', height: 52, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 10 }}>
              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20} /> Punch In</>}
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => handlePunch('out')} disabled={actionLoading}
              style={{ width: '100%', height: 52, fontSize: 15, fontWeight: 700, borderRadius: 10, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 14px rgba(239,68,68,0.25)' }}>
              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <><LogOut size={20} /> Punch Out</>}
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Work Policy */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card"
        style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(88,131,59,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={20} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>Work Hours Policy</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px 24px' }}>
              {[
                ['Start Time', '10:30 AM'],
                ['Half Day Threshold', 'Punch-in after 11:00 AM'],
                ['Full Day', '8.5+ hours logged'],
                ['Half Day', '4 to 7.9 hours logged'],
                ['LOP', 'Less than 4 hours'],
                ['Overtime', 'After 8.5h (Max 1h)'],
              ].map(([k, v]) => (
                <div key={k} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{k}:</span> {v}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }`}</style>
    </div>
  )
}
