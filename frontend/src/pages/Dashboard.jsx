import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Send, DollarSign, TrendingUp, PlusCircle, ArrowRight, Calendar } from 'lucide-react'
import api from '../api'

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <div className="fade-up" style={{
      animationDelay: `${delay}ms`,
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      padding: '22px 24px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>{sub}</div>}
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
        padding: '13px 16px',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: 10,
          background: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gold)', fontWeight: 700, fontSize: 14,
          flexShrink: 0,
        }}>
          {p.employeeName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{p.employeeName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.designation} · {p.month} {p.year}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>
          ₹{parseFloat(p.netSalary || 0).toLocaleString('en-IN')}
        </div>
        {p.emailSent && (
          <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Emailed</span>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
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
        setStats(statsRes.data.data)
        setRecent(listRes.data.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fmt = (n) => n?.toLocaleString('en-IN') ?? '—'
  const fmtCurrency = (n) => n ? '₹' + parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '₹0'

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1100 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            Welcome back — here's your payroll overview.
          </p>
        </div>
        <button
          onClick={() => navigate('/generate')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--navy)', color: 'white',
            border: 'none', borderRadius: 10, padding: '11px 20px',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            boxShadow: 'var(--shadow)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--navy-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--navy)'}
        >
          <PlusCircle size={16} />
          New Payslip
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon={FileText} label="Total Payslips" value={loading ? '—' : fmt(stats?.totalPayslips)} sub="All time" color="var(--navy)" delay={0} />
        <StatCard icon={Calendar} label="This Month" value={loading ? '—' : fmt(stats?.thisMonthPayslips)} sub="Payslips generated" color="var(--gold)" delay={80} />
        <StatCard icon={Send} label="Emails Sent" value={loading ? '—' : fmt(stats?.emailsSent)} sub="Payslips delivered" color="#0284c7" delay={160} />
        <StatCard icon={DollarSign} label="Avg. Salary" value={loading ? '—' : fmtCurrency(stats?.avgSalary)} sub="Net per employee" color="var(--green)" delay={240} />
      </div>

      {/* Recent Payslips */}
      <div className="fade-up" style={{
        animationDelay: '300ms',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Recent Payslips</div>
          <button
            onClick={() => navigate('/payslips')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--navy)', fontSize: 12, fontWeight: 600,
            }}
          >
            View all <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 10 }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <FileText size={40} color="var(--border)" style={{ margin: '0 auto 12px' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No payslips yet.</div>
            <button
              onClick={() => navigate('/generate')}
              style={{
                marginTop: 14, background: 'var(--navy)', color: 'white',
                border: 'none', borderRadius: 8, padding: '8px 18px',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              Generate your first payslip
            </button>
          </div>
        ) : (
          <div style={{ padding: '8px 4px' }}>
            {recent.map((p) => <RecentRow key={p._id} p={p} navigate={navigate} />)}
          </div>
        )}
      </div>
    </div>
  )
}
