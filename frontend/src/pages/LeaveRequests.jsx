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
      // Since pending endpoint only returns pending, I might need another endpoint for all history.
      // But for now, let's just use what we have or assume we want to see pending primarily.
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
        <h1 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 8, letterSpacing: '-0.02em' }}>Leave Management</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Review and respond to staff leave applications.</p>
      </header>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text" placeholder="Search by name or ID..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 44px', border: '2px solid var(--border)', 
              borderRadius: 14, background: 'var(--surface)', fontSize: 14, fontWeight: 500,
              outline: 'none', color: 'var(--text)'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="animate-spin text-muted" /></div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'var(--surface)', borderRadius: 24, border: '1px dashed var(--border)' }}>
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
              className="glass"
              style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}
            >
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
                  {req.staff?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--navy)', fontWeight: 800 }}>{req.staff?.fullName}</h3>
                    <span className="badge badge-navy" style={{ fontSize: 10 }}>{req.type} LEAVE</span>
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
                  <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 700 }}>CASUAL BAL: <span style={{ color: 'var(--navy)' }}>{req.staff?.leaveBalance?.casual || 0}d</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 700 }}>SICK BAL: <span style={{ color: 'var(--navy)' }}>{req.staff?.leaveBalance?.sick || 0}d</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setNoteModal(req._id)}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--navy)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                  }}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setNoteModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 480, padding: 32, position: 'relative', zIndex: 1 }}
            >
              <h2 style={{ fontSize: 24, color: 'var(--navy)', marginBottom: 16 }}>Leave Decision</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Add a note for the employee regarding this decision.</p>
              
              <textarea
                placeholder="Write a message for the employee... (Optional)"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                style={{ width: '100%', height: 120, padding: 16, borderRadius: 16, border: '2px solid var(--border)', background: 'var(--bg)', outline: 'none', resize: 'none', fontSize: 14, marginBottom: 24 }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button
                  onClick={() => handleResponse(noteModal, 'Rejected')}
                  disabled={actionLoading === noteModal}
                  style={{ height: 52, borderRadius: 14, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {actionLoading === noteModal ? <Loader2 size={20} className="animate-spin" /> : <><XCircle size={20} /> Deny Leave</>}
                </button>
                <button
                  onClick={() => handleResponse(noteModal, 'Approved')}
                  disabled={actionLoading === noteModal}
                  style={{ height: 52, borderRadius: 14, border: 'none', background: 'var(--emerald)', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
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
