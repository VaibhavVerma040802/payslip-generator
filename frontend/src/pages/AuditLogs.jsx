import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, Activity, UserPlus, UserMinus, UserCheck, Key, Ban, FileText, Send, Download, LogOut, Clock, AlertTriangle, Zap, CheckCircle2, UserCog, History } from 'lucide-react'
import api from '../api'
import { formatDistanceToNow } from 'date-fns'

const RecentRow = React.memo(({ log, navigate }) => {
  const getActionConfig = (action) => {
    switch (action) {
      case 'PAYSLIP_GENERATED': return { icon: FileText, color: 'var(--primary)', label: 'Payslip' }
      case 'EMAIL_SENT': return { icon: Send, color: 'var(--primary)', label: 'Email' }
      case 'BULK_EMAIL': return { icon: Zap, color: 'var(--primary)', label: 'Bulk Email' }
      case 'STAFF_CREATED': return { icon: UserPlus, color: 'var(--primary)', label: 'Staff' }
      case 'STAFF_UPDATED': return { icon: UserCog, color: 'var(--primary)', label: 'Update' }
      case 'STAFF_DELETED': return { icon: UserMinus, color: 'var(--primary)', label: 'Deletion' }
      case 'PORTAL_ACCESS_GRANTED': return { icon: Key, color: 'var(--primary)', label: 'Access' }
      case 'PORTAL_ACCESS_REVOKED': return { icon: Ban, color: 'var(--primary)', label: 'Revoke' }
      case 'PUNCH_OUT': return { icon: Clock, color: 'var(--primary)', label: 'Attendance' }
      case 'ATTENDANCE_RESOLVED': return { icon: CheckCircle2, color: 'var(--primary)', label: 'Resolved' }
      case 'FORCE_PUNCH_OUT': return { icon: LogOut, color: 'var(--primary)', label: 'Admin Fix' }
      default: return { icon: Activity, color: 'var(--primary)', label: 'System' }
    }
  }

  const config = getActionConfig(log.action)
  const Icon = config.icon

  return (
    <div
      onClick={() => {
        if (log.metadata?.payslipId) navigate(`/payslips/${log.metadata.payslipId}`)
        else if (log.metadata?.staffId) navigate(`/staff/${log.metadata.staffId}`)
      }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderRadius: 12,
        cursor: (log.metadata?.payslipId || log.metadata?.staffId) ? 'pointer' : 'default',
        transition: 'all 0.2s',
        marginBottom: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)'
      }}
      className="btn-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: 12,
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: config.color, flexShrink: 0
        }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{log.details}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
             <span style={{ color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', fontSize: 10 }}>{config.label}</span>
             <span>•</span>
             {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
      {(log.metadata?.payslipId || log.metadata?.staffId) && (
        <ChevronRight size={18} color="var(--text-light)" />
      )}
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
        const res = await api.get('/activities?limit=50')
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
          width: 56, height: 56, borderRadius: 14, background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff',
          boxShadow: '0 8px 16px rgba(88, 131, 59, 0.2)'
        }}>
          <History size={28} />
        </div>
        <div>
          <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: 'clamp(24px, 4vw, 32px)' }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 15 }}>A complete history of workspace actions and system events.</p>
        </div>
      </header>

      <div className="fade-in glass" style={{ animationDelay: '100ms', overflow: 'hidden', borderRadius: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(88, 131, 59, 0.03)'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)', letterSpacing: '-0.01em' }}>Activity Timeline</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Tracking every statutory action in real-time</div>
          </div>
          <div style={{ padding: '6px 14px', background: 'var(--bg)', borderRadius: 10, fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Feed
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 76, marginBottom: 12, borderRadius: 12 }} />
            ))
          ) : recent.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Building2 size={48} color="var(--border)" style={{ margin: '0 auto 20px' }} />
              <div style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No activity yet</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>System events and generated slips will appear here.</p>
              <button
                onClick={() => navigate('/generate')}
                className="btn-primary"
              >
                Start Generating Slips
              </button>
            </div>
          ) : (
            recent.map((log) => <RecentRow key={log._id} log={log} navigate={navigate} />)
          )}
        </div>
      </div>
    </div>
  )
}
