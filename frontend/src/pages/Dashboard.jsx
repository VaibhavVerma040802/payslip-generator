import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Users, IndianRupee, LayoutDashboard, Calendar, AlertTriangle, PieChart, Send, Download, LogOut, UserPlus, Zap, CheckCircle2, Loader2, FileSpreadsheet, UserCheck, Briefcase, ChevronRight, Activity } from 'lucide-react'
import { Plus } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const StatCard = React.memo(({ icon: Icon, label, value, sub, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
      className="card glass btn-hover" 
      style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: 24, borderRadius: 20
      }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: 14,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: '1px solid var(--border)', color: 'var(--primary)'
      }}>
        <Icon size={28} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{sub}</div>}
      </div>
    </motion.div>
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

  const QuickAction = ({ icon: Icon, label, desc, onClick, id }) => (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isProcessing !== null}
      className="card glass btn-hover"
      style={{
        padding: 24, textAlign: 'left', display: 'flex', gap: 20, alignItems: 'center',
        cursor: 'pointer', transition: 'all 0.2s', width: '100%', outline: 'none', border: '1px solid var(--border)',
        borderRadius: 20
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0
      }}>
        {isProcessing === id ? <Loader2 size={24} className="animate-spin" /> : <Icon size={24} />}
      </div>
      <div>
        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16, marginBottom: 4, letterSpacing: '-0.01em' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{desc}</div>
      </div>
    </motion.button>
  )

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 48px)', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header Section */}
      <div className="fade-in" style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Activity size={16} />
            System Status: Operational
          </div>
          <h1 style={{ color: 'var(--primary)', marginBottom: 8, fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '-0.03em' }}>
            {user?.companyName ? `Welcome back, ${user.companyName.split(' ')[0]}` : 'Workspace Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 600 }}>
            You've generated <strong>{fmt(stats?.totalPayslips)} statutory documents</strong> for your workforce.
          </p>
        </div>
        <button
          onClick={() => navigate('/generate')}
          className="btn-primary"
          style={{ height: 56, padding: '0 32px', borderRadius: 16, fontSize: 16 }}
        >
          <Plus size={20} strokeWidth={3} />
          Create New Payslip
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: 24, 
        marginBottom: 56 
      }}>
        <StatCard icon={Users} label="Total Workforce" value={loading ? '—' : (stats?.totalEmployees || 0)} sub="Active Employees & Interns" delay={0} />
        <StatCard icon={PieChart} label="Portal Adoption" value={loading ? '—' : (stats?.activePortals || 0)} sub="Provisioned Staff Accounts" delay={100} />
        <StatCard icon={AlertTriangle} label="Attendance Flags" value={loading ? '—' : (stats?.attendanceFlags || 0)} sub="Requires Administrator Action" delay={200} />
        <StatCard icon={IndianRupee} label="Total Disbursement" value={loading ? '—' : fmtCurrency(stats?.totalPayroll)} sub="Lifetime Salary & Stipends" delay={300} />
      </div>

      {/* Quick Actions Terminal */}
      <div className="fade-up" style={{ marginBottom: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Zap size={24} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: 24, color: 'var(--primary)', fontWeight: 900, letterSpacing: '-0.02em' }}>Quick Actions Terminal</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <QuickAction id="email" icon={Send} label="Bulk Email Dispatch" desc="Email unsent slips for the current month" onClick={handleBulkEmail} />
          <QuickAction id="export" icon={Download} label="Export Attendance" desc="Download statutory attendance records (CSV)" onClick={handleExportAttendance} />
          <QuickAction id="punch" icon={LogOut} label="Emergency Punch-Out" desc="Force close all active shifts from past days" onClick={handleForcePunchOut} />
          <QuickAction id="staff" icon={UserPlus} label="Staff Provisioning" desc="Onboard a new member to the workspace" onClick={() => navigate('/staff')} />
        </div>
      </div>

      {/* Pending Actions */}
      {!loading && pendingActions.length > 0 && (
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, color: 'var(--primary)', fontWeight: 900, letterSpacing: '-0.01em' }}>Action Required: Attendance</h2>
              <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Review and resolve flagged shifts to ensure payroll accuracy.</p>
            </div>
          </div>

          <div className="card glass" style={{ padding: 0, overflow: 'hidden', borderRadius: 24 }}>
            {pendingActions.map((action, idx) => (
              <div key={action._id} style={{ 
                padding: '24px 32px', 
                borderBottom: idx === pendingActions.length - 1 ? 'none' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(88, 131, 59, 0.02)',
                transition: 'background 0.2s'
              }} className="btn-hover">
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                   <div style={{ 
                     width: 52, height: 52, borderRadius: 14, 
                     background: 'var(--primary)', color: 'white',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', 
                     fontSize: 20, fontWeight: 900 
                   }}>
                     {(action.staff?.fullName || '?').charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 17 }}>{action.staff?.fullName || 'Unnamed Staff'}</div>
                     <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                       <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{action.staff?.employeeId || 'NO-ID'}</span>
                       <span>•</span>
                       <span>{new Date(action.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                     </div>
                   </div>
                </div>
                
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="badge badge-red" style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px' }}>
                      {action.status === 'flagged' ? 'Over 16h Logged' : 'Missing Punch-Out'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
                      Logged In: {new Date(action.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/staff/${action.staff?._id}`)}
                    className="btn-primary"
                    style={{ padding: '10px 24px', fontSize: 14, borderRadius: 12 }}
                  >
                    Resolve Now <ChevronRight size={16} />
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
