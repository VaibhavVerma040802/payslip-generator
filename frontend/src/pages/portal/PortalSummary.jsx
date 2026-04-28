import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'
import { motion } from 'framer-motion'

export default function PortalSummary() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklySummary()
  }, [currentWeek])

  const fetchWeeklySummary = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/attendance/weekly?date=${currentWeek.toISOString()}`)
      setSummary(res.data.summary)
    } catch (err) {
      console.error('Failed to fetch weekly summary')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevWeek = () => {
    const prev = new Date(currentWeek)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeek(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(currentWeek)
    next.setDate(next.getDate() + 7)
    setCurrentWeek(next)
  }

  const getWeekRange = () => {
    const day = currentWeek.getDay() || 7
    const monday = new Date(currentWeek)
    monday.setDate(currentWeek.getDate() - day + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
      <section>
        <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 8 }}>Weekly Performance</h1>
            <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>A snapshot of your productivity and work-life balance.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface)', padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <button onClick={handlePrevWeek} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={20} /></button>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', minWidth: 160, textAlign: 'center' }}>
              {getWeekRange()}
            </div>
            <button onClick={handleNextWeek} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={20} /></button>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={40} className="animate-spin text-muted" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* Main Stat Card */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ padding: 32, gridColumn: '1 / -1', background: 'var(--primary)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Total Work Hours</div>
                  <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'var(--font-display)' }}>{(summary?.totalHours || 0).toFixed(1)}h</div>
                </div>
                <div style={{ width: 64, height: 64, borderRadius: 6, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={32} color="white" />
                </div>
              </div>
              <div style={{ marginTop: 32, display: 'flex', gap: 40 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>DAYS WORKED</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{summary?.presentDays || 0} / 7</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>OVERTIME</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{(summary?.totalOT || 0).toFixed(1)}h</div>
                </div>
              </div>
            </motion.div>

            {/* Productivity Insights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Clock size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)' }}>Avg. Shift</h3>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{(summary?.avgHours || 0).toFixed(1)}h</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Average duration of your shifts this week.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertCircle size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)' }}>Flags</h3>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{summary?.flaggedCount || 0}</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Records requiring administrative review.</p>
            </motion.div>
          </div>
        )}
      </section>
    </div>
  )
}
