import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, Activity } from 'lucide-react'
import api from '../api'

const RecentRow = React.memo(({ p, navigate }) => {
  return (
    <div
      onClick={() => navigate(`/payslips/${p._id}`)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: 8,
        background: 'var(--surface)',
        border: '1px solid var(--border)'
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
});

export default function AuditLogs() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get('/payslips?limit=20')
        setRecent(res.data?.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 48px)', maxWidth: 1200, margin: '0 auto' }}>
      <header className="fade-in" style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)'
        }}>
          <Activity size={24} />
        </div>
        <div>
          <h1 style={{ color: 'var(--navy)', marginBottom: 4, fontSize: 28, letterSpacing: '-0.02em' }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 15 }}>Recent workspace activities and generated slips.</p>
        </div>
      </header>

      <div className="fade-in glass" style={{ animationDelay: '100ms', overflow: 'hidden' }}>
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
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 76, marginBottom: 12, borderRadius: 16 }} />
            ))
          ) : recent.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Building2 size={48} color="var(--border)" style={{ margin: '0 auto 20px' }} />
              <div style={{ color: 'var(--navy)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No recent activity</div>
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
  )
}
