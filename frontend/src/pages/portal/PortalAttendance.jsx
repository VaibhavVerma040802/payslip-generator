import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'
import { motion } from 'framer-motion'

export default function PortalAttendance() {
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchHistory()
  }, [month, year])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/attendance/history?month=${month}&year=${year}`)
      setHistory(res.data.history)
      setSummary(res.data.summary)
    } catch (err) {
      toast.error(err.message || 'Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => date ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 8 }}>Attendance History</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Review your detailed work logs and monthly summaries.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface)', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
          <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={20} /></button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', minWidth: 140, textAlign: 'center' }}>
            {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
        {[
          { label: 'Total Present', value: summary?.presentDays || 0, icon: CalendarIcon, color: 'var(--emerald)' },
          { label: 'Avg. Daily Hours', value: `${(summary?.avgHours || 0).toFixed(1)}h`, icon: Clock, color: 'var(--primary)' },
          { label: 'Overtime Total', value: `${(summary?.totalOT || 0).toFixed(1)}h`, icon: Clock, color: 'var(--primary)' },
          { label: 'Flagged Records', value: summary?.flaggedCount || 0, icon: AlertCircle, color: '#ef4444' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* History Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Work Hours</th>
                <th>Overtime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: 60, textAlign: 'center' }}>
                    <Loader2 size={32} className="animate-spin text-muted" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
                    No records found for this period.
                  </td>
                </tr>
              ) : (
                history.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatDate(row.date)}</td>
                    <td>{formatTime(row.punchIn)}</td>
                    <td>{formatTime(row.punchOut)}</td>
                    <td><span style={{ fontWeight: 600 }}>{row.totalHours.toFixed(2)}h</span></td>
                    <td>{row.overtimeHours > 0 ? <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>+{row.overtimeHours.toFixed(2)}h</span> : '--'}</td>
                    <td>
                      <div className={`badge ${
                        row.workStatus === 'Active' ? 'badge-emerald' :
                        row.workStatus === 'Full Day' ? 'badge-emerald' : 
                        row.workStatus === 'Half Day' ? 'badge-navy' :
                        row.workStatus === 'LOP' ? 'badge-red' : 'badge-navy'
                      }`} style={{ 
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: row.workStatus === 'Active' ? 'var(--primary)' : undefined,
                        color: row.workStatus === 'Active' ? 'white' : undefined
                      }}>
                        {row.workStatus === 'Active' && (
                          <span style={{ 
                            width: 6, height: 6, borderRadius: '50%', background: 'white',
                            animation: 'pulse 1.5s infinite'
                          }} />
                        )}
                        {(row.workStatus || row.status).toUpperCase()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

const pulseStyle = `
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.3); }
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = pulseStyle
  document.head.appendChild(style)
}
