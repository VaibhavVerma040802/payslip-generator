import { useState, useEffect } from 'react'
import { LogIn, LogOut, Clock, Calendar as CalendarIcon, AlertCircle, Loader2, Timer } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'
import { motion } from 'framer-motion'

export default function PortalDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeShift, setActiveShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    fetchActiveShift()
    return () => clearInterval(timer)
  }, [])

  const fetchActiveShift = async () => {
    try {
      const res = await api.get('/attendance/active')
      setActiveShift(res.data.activeShift)
    } catch (err) {
      console.error('Failed to fetch active shift', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePunch = async (type) => {
    setActionLoading(true)
    try {
      const endpoint = type === 'in' ? '/attendance/punch-in' : '/attendance/punch-out'
      const res = await api.post(endpoint, {})
      toast.success(res.data.message)
      fetchActiveShift()
    } catch (err) {
      toast.error(err.message || `Failed to punch ${type}`)
    } finally {
      setActionLoading(false)
    }
  }

  const formatDuration = (start) => {
    const diff = Math.floor((new Date() - new Date(start)) / 1000)
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    const s = diff % 60
    return `${h}h ${m}m ${s}s`
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
      <Loader2 size={40} className="animate-spin text-muted" />
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 8 }}>Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}</h1>
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

        {/* Action Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--navy)', fontSize: 18 }}>Shift Status</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>{activeShift ? 'Currently PUNCHED IN' : 'Currently PUNCHED OUT'}</p>
            </div>
            <div className={`badge ${activeShift ? 'badge-emerald' : 'badge-navy'}`}>
              {activeShift ? 'Active' : 'Off-Duty'}
            </div>
          </div>

          {activeShift && (
            <div style={{ marginBottom: 32, padding: 16, background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                <Timer size={16} /> SESSION DURATION
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>
                {formatDuration(activeShift.punchIn)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            {!activeShift ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePunch('in')}
                disabled={actionLoading}
                style={{
                  flex: 1, height: 56, background: 'var(--emerald)', color: 'white',
                  border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s'
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
                  flex: 1, height: 56, background: '#ef4444', color: 'white',
                  border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.3)', transition: 'all 0.2s'
                }}
              >
                {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                Punch Out
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 24 }} className="glass">
        <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: 15 }}>Work Hours Policy</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Standard shift is 8.5 hours. Overtime is tracked automatically up to 4 hours per day. Please ensure you punch out at the end of your shift to avoid records being flagged.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
