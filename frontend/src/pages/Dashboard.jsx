import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Send, DollarSign, TrendingUp, PlusCircle, ArrowRight, Calendar, Building2 } from 'lucide-react'
import { Plus, ChevronRight } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
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
}

function RecentRow({ p, navigate }) {
  return (
    <div
      onClick={() => navigate(`/payslips/${p._id}`)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: 4
      }}
      className="btn-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: 12,
          background: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gold)', fontWeight: 900, fontSize: 16,
          flexShrink: 0, boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
        }}>
          {p.employeeName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{p.employeeName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{p.designation} · {p.month} {p.year}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 800, color: 'var(--emerald)', fontSize: 16 }}>
          ₹{parseFloat(p.netSalary || 0).toLocaleString('en-IN')}
        </div>
        {p.emailSent && (
          <div className="badge badge-green" style={{ marginTop: 4, transform: 'scale(0.9)', transformOrigin: 'right' }}>Delivered</div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          api.get('/payslips/stats/summary'),
          api.get('/payslips?limit=5'),
        ])
        setStats(statsRes.data?.data || null)
        setRecent(listRes.data?.data || [])
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
        <StatCard icon={FileText} label="Total Volume" value={loading ? '—' : fmt(stats?.totalPayslips)} sub="Lifetime Generation" color="#6366f1" delay={0} />
        <StatCard icon={TrendingUp} label="This Month" value={loading ? '—' : fmt(stats?.thisMonthPayslips)} sub="New Payroll Cycle" color="var(--gold)" delay={100} />
        <StatCard icon={Send} label="Email Delivery" value={loading ? '—' : fmt(stats?.emailsSent)} sub="Successful Pushes" color="#0ea5e9" delay={200} />
        <StatCard icon={DollarSign} label="Avg. Payroll" value={loading ? '—' : fmtCurrency(stats?.avgSalary)} sub="Net Per Employee" color="var(--emerald)" delay={300} />
      </div>

      {/* Main Feature Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        <div className="fade-in glass" style={{ animationDelay: '400ms', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 32px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg)'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--navy)' }}>Recent Activity</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Latest salary slips generated</div>
            </div>
            <button
              onClick={() => navigate('/payslips')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer',
                color: 'var(--navy)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10
              }}
              className="btn-hover"
            >
              Archive <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ padding: '16px' }}>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 16 }} />
              ))
            ) : recent.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <Building2 size={48} color="var(--border)" style={{ margin: '0 auto 20px' }} />
                <div style={{ color: 'var(--navy)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Workspace is empty</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Start by generating your first statutory compliance document.</p>
                <button
                  onClick={() => navigate('/generate')}
                  style={{
                    background: 'var(--navy)', color: 'white',
                    border: 'none', borderRadius: 12, padding: '12px 24px',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Create First Slip
                </button>
              </div>
            ) : (
              recent.map((p) => <RecentRow key={p._id} p={p} navigate={navigate} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
