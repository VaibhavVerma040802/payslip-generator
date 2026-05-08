import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, AlertCircle, Loader2, CheckCircle2, XCircle, Search, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../api'
import { motion, AnimatePresence } from 'framer-motion'

export default function LeaveRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('Pending')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [noteModal, setNoteModal] = useState(null) // ID of request being responded to
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [filterStatus])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const statusParam = filterStatus !== 'All' ? { status: filterStatus } : {}
      const res = await api.get('/leaves/admin/pending', { params: statusParam })
      setRequests(res.data.data)
    } catch (err) {
      toast.error('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (id, status) => {
    setActionLoading(id)
    try {
      await api.post('/leaves/admin/respond', { id, status, adminNotes: adminNote })
      toast.success(`Request ${status.toLowerCase()} successfully`)
      setNoteModal(null)
      setAdminNote('')
      fetchRequests()
    } catch (err) {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRequests = requests.filter(r => {
    const query = search.toLowerCase()
    const matchesSearch = r.staff?.fullName?.toLowerCase().includes(query) || 
                          r.staff?.employeeId?.toLowerCase().includes(query)
    return matchesSearch
  })

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 48px)', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Leave & Attendance</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Review and respond to staff leave applications and attendance records.</p>
      </header>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 320px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text" placeholder="Search by name or ID..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: 44 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: filterStatus === status ? 'var(--primary)' : 'var(--surface)',
                color: filterStatus === status ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="animate-spin text-muted" /></div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border)' }}>
          <CalendarIcon size={48} color="var(--text-light)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No pending requests</h3>
          <p style={{ color: 'var(--text-muted)' }}>All caught up! New requests will appear here.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 2fr 1fr auto', gap: 16, padding: '14px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <div>Employee</div>
            <div>Dates</div>
            <div>Reason</div>
            <div>Balances</div>
            <div style={{ textAlign: 'right' }}>Action</div>
          </div>
          {filteredRequests.map((req) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 2fr 1fr auto', gap: 16, padding: '16px 20px', alignItems: 'center', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                  {req.staff?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.staff?.fullName}</div>
                    <span className="badge badge-emerald" style={{ fontSize: 10 }}>{req.type} LEAVE</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{req.staff?.employeeId || '—'}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                <div>{new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', fontSize: 12, marginBottom: 6, alignItems: 'center' }}>
                  <MessageSquare size={14} /> <span style={{ fontWeight: 600 }}>Reason</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{req.reason}</p>
              </div>

              <div style={{ display: 'grid', gap: 6, fontSize: 11, color: 'var(--text-light)', fontWeight: 700 }}>
                <div>CASUAL: <span style={{ color: 'var(--primary)' }}>{req.staff?.leaveBalance?.casual || 0}d</span></div>
                <div>SICK: <span style={{ color: 'var(--primary)' }}>{req.staff?.leaveBalance?.sick || 0}d</span></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setNoteModal(req._id)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13 }}
                >
                  Review
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <AnimatePresence>
        {noteModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setNoteModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}
            >
              <h2 style={{ fontSize: 24, color: 'var(--primary)', marginBottom: 16 }}>Leave Decision</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Add a note for the employee regarding this decision.</p>
              
              <textarea
                placeholder="Write a message for the employee... (Optional)"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                className="input-field"
                style={{ width: '100%', height: 120, padding: 16, outline: 'none', resize: 'none', fontSize: 14, marginBottom: 24 }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button
                  onClick={() => handleResponse(noteModal, 'Rejected')}
                  disabled={actionLoading === noteModal}
                  className="btn-secondary"
                  style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {actionLoading === noteModal ? <Loader2 size={20} className="animate-spin" /> : <><XCircle size={20} /> Deny Leave</>}
                </button>
                <button
                  onClick={() => handleResponse(noteModal, 'Approved')}
                  disabled={actionLoading === noteModal}
                  className="btn-primary"
                  style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {actionLoading === noteModal ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> Approve</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
