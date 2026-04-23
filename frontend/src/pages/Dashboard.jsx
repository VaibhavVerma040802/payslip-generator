import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Send, DollarSign, TrendingUp, PlusCircle, ArrowRight, Calendar, Building2 } from 'lucide-react'
import { Plus, ChevronRight } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/payslips/stats/summary')
        setStats(statsRes.data?.data || null)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const fmt = (n) => n?.toLocaleString('en-IN') ?? '—'
  const fmtCurrency = (n) => n ? '₹' + parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '₹0'

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
        marginBottom: 40 
      }}>
        <StatCard icon={FileText} label="Total Volume" value={loading ? '—' : (stats?.totalPayslips || 0)} sub="Lifetime Generation" color="#6366f1" delay={0} />
        <StatCard icon={TrendingUp} label="This Month" value={loading ? '—' : (stats?.thisMonthPayslips || 0)} sub="New Payroll Cycle" color="var(--gold)" delay={100} />
        <StatCard icon={Send} label="Email Delivery" value={loading ? '—' : (stats?.emailsSent || 0)} sub="Successful Pushes" color="#0ea5e9" delay={200} />
        <StatCard icon={DollarSign} label="Total Amount Paid" value={loading ? '—' : fmtCurrency(stats?.totalPayroll)} sub="Total Payroll Disbursed" color="var(--emerald)" delay={300} />
      </div>


    </div>
  )
}
