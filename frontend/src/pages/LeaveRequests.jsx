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
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api.get('/leaves/admin/pending')
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
    const matchesSearch = r.staff?.fullName?.toLowerCase().includes(search.toLowerCase()) || 
                          r.staff?.employeeId?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 48px)', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Leave Management</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Review and respond to staff leave applications.</p>
      </header>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text" placeholder="Search by name or ID..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ width: '100%', paddingLeft: 44 }}
          />
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
        <div style={{ display: 'grid', gap: 20 }}>
          {filteredRequests.map((req) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}
            >
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 6, background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600 }}>
                  {req.staff?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)', fontWeight: 800 }}>{req.staff?.fullName}</h3>
                    <span className="badge badge-emerald" style={{ fontSize: 10 }}>{req.type} LEAVE</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                    {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 300, padding: '0 24px' }}>
                <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>
                  <MessageSquare size={14} /> <span style={{ fontWeight: 600 }}>Reason:</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{req.reason}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 700 }}>CASUAL BAL: <span style={{ color: 'var(--primary)' }}>{req.staff?.leaveBalance?.casual || 0}d</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 700 }}>SICK BAL: <span style={{ color: 'var(--primary)' }}>{req.staff?.leaveBalance?.sick || 0}d</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setNoteModal(req._id)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
                >
                  Review & Respond
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
