import { useState, useEffect, useCallback } from 'react'
import { LogIn, LogOut, Clock, Calendar as CalendarIcon, AlertCircle, Loader2, Timer } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'
import { motion } from 'framer-motion'

export default function PortalDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeShift, setActiveShift] = useState(null) // null = not punched in
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch current shift state on mount
  const fetchActiveShift = useCallback(async () => {
    try {
      const res = await api.get('/attendance/active')
      // activeShift is the open record (punched in but NOT punched out yet)
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
      const endpoint = type === 'in' ? '/attendance/punch-in' : '/attendance/punch-out'
      const res = await api.post(endpoint, {})
      toast.success(res.data.message)
      // Re-fetch active shift to update button state
      await fetchActiveShift()
    } catch (err) {
      toast.error(err.message || `Failed to punch ${type}`)
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

  const isPunchedIn = Boolean(activeShift && !activeShift.punchOut)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
      <Loader2 size={40} className="animate-spin text-muted" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 8 }}>
          Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ready to track your progress today?</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* Live Clock Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', marginBottom: 20 }}>
            <Clock size={32} />
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--navy)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontWeight: 600 }}>
            <CalendarIcon size={16} />
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </motion.div>

        {/* Punch Action Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--navy)', fontSize: 18 }}>Shift Status</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
                {isPunchedIn ? 'Currently PUNCHED IN' : 'Currently PUNCHED OUT'}
              </p>
            </div>
            {/* Status badge — green Active when punched in, navy Off-Duty otherwise */}
            <div
              className={`badge ${isPunchedIn ? 'badge-emerald' : 'badge-navy'}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: isPunchedIn ? 'var(--emerald)' : undefined,
                color: 'white',
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
              {isPunchedIn ? 'ACTIVE' : 'OFF-DUTY'}
            </div>
          </div>

          {/* Session timer — only visible when punched in */}
          {isPunchedIn && activeShift?.punchIn && (
            <div style={{ marginBottom: 32, padding: 16, background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                <Timer size={16} /> SESSION DURATION
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
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
              style={{
                width: '100%', height: 56, background: 'var(--emerald)', color: 'white',
                border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.35)', transition: 'all 0.2s',
                opacity: actionLoading ? 0.7 : 1,
              }}
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
              style={{
                width: '100%', height: 56, background: '#ef4444', color: 'white',
                border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.35)', transition: 'all 0.2s',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
              Punch Out
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Work Policy Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 24 }} className="glass">
        <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: 15 }}>Work Hours Policy</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Standard shift is <strong>8.5 hours</strong> starting from 10:30 AM. Overtime is tracked automatically up to 4 hours per day. Always punch out at end of shift to avoid flagged records.
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
