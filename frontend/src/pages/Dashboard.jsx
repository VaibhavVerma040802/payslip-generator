import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Users, IndianRupee, LayoutDashboard, Calendar, AlertTriangle, PieChart, Send, Download, LogOut, UserPlus, Zap, CheckCircle2, Loader2, FileSpreadsheet, UserCheck, Briefcase } from 'lucide-react'
import { Plus } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const StatCard = React.memo(({ icon: Icon, label, value, sub, color, delay = 0 }) => {
  return (
    <div className="fade-up glass" style={{
      animationDelay: `${delay}ms`,
      padding: '24px',
      display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: 16,
        background: `${color}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: `1px solid ${color}20`
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  )
});


export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingActions, setPendingActions] = useState([])
  const [isProcessing, setIsProcessing] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          api.get('/payslips/stats/summary'),
          api.get('/attendance/admin/pending')
        ])
        setStats(statsRes.data?.data || null)
        setPendingActions(pendingRes.data?.data || [])
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const handleBulkEmail = async () => {
    const month = new Date().toLocaleString('en-US', { month: 'long' })
    const year = new Date().getFullYear()
    
    if (!window.confirm(`Are you sure you want to email all unsent payslips for ${month} ${year}?`)) return
    
    setIsProcessing('email')
    try {
      const res = await api.post('/payslips/bulk-email-month', { month, year })
      toast.success(res.data.message)
    } catch (err) {
      toast.error('Bulk email failed')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleExportAttendance = async () => {
    setIsProcessing('export')
    try {
      const response = await api.get('/attendance/admin/export-csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Attendance_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Attendance report downloaded')
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleForcePunchOut = async () => {
    if (!window.confirm('This will close all open shifts from previous days and mark them as flagged. Continue?')) return
    
    setIsProcessing('punch')
    try {
      const res = await api.post('/attendance/admin/force-punch-out')
      toast.success(res.data.message)
      const pendingRes = await api.get('/attendance/admin/pending')
      setPendingActions(pendingRes.data?.data || [])
    } catch (err) {
      toast.error('Force punch-out failed')
    } finally {
      setIsProcessing(null)
    }
  }

  const fmt = (n) => n?.toLocaleString('en-IN') ?? '—'
  const fmtCurrency = (n) => n ? '₹' + parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '₹0'

  const QuickAction = ({ icon: Icon, label, desc, onClick, color, id }) => (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isProcessing !== null}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
        padding: 24, textAlign: 'left', display: 'flex', gap: 16, alignItems: 'center',
        cursor: 'pointer', transition: 'all 0.2s', width: '100%', outline: 'none'
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0
      }}>
        {isProcessing === id ? <Loader2 size={24} className="animate-spin" /> : <Icon size={24} />}
      </div>
      <div>
        <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{desc}</div>
      </div>
    </motion.button>
  )

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 48px)', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header Section */}
      <div className="fade-in" style={{ marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Calendar size={14} color="var(--gold)" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 style={{ color: 'var(--navy)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            {user?.companyName ? `Hello, ${user.companyName.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 500 }}>
            Managed <strong>{fmt(stats?.totalPayslips)} slips</strong> in this workspace.
          </p>
        </div>
        <button
          onClick={() => navigate('/generate')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--navy)', color: 'white',
            border: 'none', borderRadius: 14, padding: '14px 28px',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)',
            transition: 'all 0.3s',
          }}
          className="btn-hover"
        >
          <Plus size={18} strokeWidth={3} />
          Generate New Slip
        </button>
      </div>

      {/* Responsive Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: 24, 
        marginBottom: 48 
      }}>
        <StatCard icon={Users} label="Total Employees" value={loading ? '—' : (stats?.totalEmployees || 0)} sub="Workforce Strength" color="#6366f1" delay={0} />
        <StatCard icon={PieChart} label="Workforce Split" value={loading ? '—' : `${stats?.workforceSplit?.employees || 0}E | ${stats?.workforceSplit?.interns || 0}I`} sub="Emp vs Interns" color="#8b5cf6" delay={100} />
        <StatCard icon={AlertTriangle} label="Attendance Flags" value={loading ? '—' : (stats?.attendanceFlags || 0)} sub="Action Required" color="#f59e0b" delay={200} />
        <StatCard icon={IndianRupee} label="Total Salary Disbursed" value={loading ? '—' : fmtCurrency(stats?.totalPayroll)} sub="Lifetime Cumulative" color="var(--emerald)" delay={300} />
      </div>

      {/* Quick Actions Terminal */}
      <div className="fade-up" style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Zap size={20} color="var(--gold)" />
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--navy)', fontWeight: 800 }}>Quick Actions Terminal</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <QuickAction id="email" icon={Send} label="Bulk Email Slips" desc="Send all unsent slips for this month" color="#0ea5e9" onClick={handleBulkEmail} />
          <QuickAction id="export" icon={Download} label="Export Attendance" desc="Download current month's CSV" color="#10b981" onClick={handleExportAttendance} />
          <QuickAction id="punch" icon={LogOut} label="Force Punch-Out" desc="Close stale shifts from previous days" color="#f43f5e" onClick={handleForcePunchOut} />
          <QuickAction id="staff" icon={UserPlus} label="Add New Staff" desc="Invite a new employee to portal" color="#8b5cf6" onClick={() => navigate('/staff')} />
        </div>
      </div>

      {/* Pending Actions Section */}
      {!loading && pendingActions.length > 0 && (
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', border: '1px solid #fef3c7' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: 'var(--navy)' }}>Attendance Actions Required</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Review and correct flagged or incomplete attendance records.</p>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {pendingActions.map((action, idx) => (
              <div key={action._id} style={{ 
                padding: '20px 24px', 
                borderBottom: idx === pendingActions.length - 1 ? 'none' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
                transition: 'background 0.2s'
              }} className="hover:bg-gray-50">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                   <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', fontWeight: 800 }}>
                     {action.staff?.fullName?.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{action.staff?.fullName}</div>
                     <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{action.staff?.employeeId} · {new Date(action.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                   </div>
                </div>
                
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="badge" style={{ background: action.status === 'flagged' ? '#fee2e2' : '#fffbeb', color: action.status === 'flagged' ? '#ef4444' : '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {action.status === 'flagged' ? 'Over 16h' : 'Missing Out'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
                      In: {new Date(action.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/staff/${action.staff?._id}`)}
                    style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
