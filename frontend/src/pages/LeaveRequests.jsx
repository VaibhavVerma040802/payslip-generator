import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Clock, Loader2, CheckCircle2, XCircle,
  Search, MessageSquare, Download, ChevronLeft, ChevronRight,
  UserCheck, AlertTriangle, ClipboardList, TrendingUp, MapPin
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'

// ─── styles ──────────────────────────────────────────────────────────────────
const pageStyles = `
  .la-tabs { display:flex; gap:4px; padding:4px; background:var(--bg); border:1px solid var(--border); border-radius:10px; width:fit-content; }
  .la-tab  { padding:8px 20px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.18s; color:var(--text-muted); background:transparent; }
  .la-tab.active { background:var(--surface); color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,0.10); }
  .la-pill { display:inline-flex; align-items:center; gap:3px; padding:2px 10px; border-radius:999px; font-size:11px; font-weight:700; white-space:nowrap; }
  .la-pill-green  { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
  .la-pill-orange { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
  .la-pill-blue   { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
  .la-pill-yellow { background:#fefce8; color:#854d0e; border:1px solid #fde047; }
  .la-pill-red    { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
  .la-pill-slate  { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
  .la-pill-purple { background:#faf5ff; color:#6b21a8; border:1px solid #e9d5ff; }
  .la-stat { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 20px; display:flex; align-items:center; gap:14px; }
  .la-table-head { display:grid; gap:8px; padding:11px 20px; background:var(--bg); border-bottom:1px solid var(--border); }
  .la-row        { display:grid; gap:8px; padding:13px 20px; border-bottom:1px solid var(--border); align-items:center; transition:background 0.13s; }
  .la-row:last-child  { border-bottom:none; }
  .la-row:hover  { background:rgba(0,0,0,0.018); }
  .la-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  .la-filter-btn { padding:7px 14px; border-radius:999px; border:1px solid var(--border); font-size:12px; font-weight:700; cursor:pointer; transition:all 0.18s; }
  .la-month-select { padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13px; font-weight:500; cursor:pointer; outline:none; }
  .la-export-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 18px; border-radius:8px; border:1px solid var(--primary); background:var(--primary); color:#fff; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.16s; }
  .la-export-btn:hover { opacity:0.88; }
  .la-map-link { display:inline-flex; align-items:center; gap:3px; margin-top:3px; font-size:11px; font-weight:600; color:#1d4ed8; text-decoration:none; padding:2px 6px; border-radius:5px; background:#eff6ff; border:1px solid #bfdbfe; transition:background 0.14s; }
  .la-map-link:hover { background:#dbeafe; }
  .la-search { position:relative; }
  .la-search svg { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-light); pointer-events:none; }
  .la-search input { width:100%; padding:8px 12px 8px 38px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:13px; outline:none; }
  .la-search input:focus { border-color:var(--primary); }
`

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = dt => {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}
const fmtDate = dt => {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const fmtDateShort = dt => {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}
const fmtHours = h => {
  if (!h && h !== 0) return '—'
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  return `${hrs}h ${String(min).padStart(2,'0')}m`
}

const LATE_HOUR = 10
const isLate = punchIn => {
  if (!punchIn) return false
  const d = new Date(punchIn)
  return d.getHours() > LATE_HOUR || (d.getHours() === LATE_HOUR && d.getMinutes() > 0)
}

const Avatar = ({ name, size = 38, bg = 'var(--primary)', color = '#fff' }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: size * 0.38 }}>
    {(name || '?').charAt(0).toUpperCase()}
  </div>
)

function StatusPill({ status, workStatus }) {
  const s = workStatus || status || ''
  if (s === 'Active')    return <span className="la-pill la-pill-blue">Active</span>
  if (s === 'Full Day')  return <span className="la-pill la-pill-green">Full Day</span>
  if (s === 'Half Day')  return <span className="la-pill la-pill-yellow">Half Day</span>
  if (s === 'LOP')       return <span className="la-pill la-pill-red">LOP</span>
  if (s === 'Leave')     return <span className="la-pill la-pill-purple">Leave</span>
  if (s === 'flagged')   return <span className="la-pill la-pill-red">Flagged</span>
  if (s === 'incomplete') return <span className="la-pill la-pill-orange">Incomplete</span>
  return <span className="la-pill la-pill-slate">{s || '—'}</span>
}

// ─── Leave Tab ────────────────────────────────────────────────────────────────
function LeaveTab() {
  const [requests, setRequests]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [filterStatus, setFilterStatus] = useState('Pending')
  const [search, setSearch]             = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [noteModal, setNoteModal]       = useState(null)
  const [adminNote, setAdminNote]       = useState('')

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const params = filterStatus !== 'All' ? { status: filterStatus } : {}
      const res = await api.get('/leaves/admin/pending', { params })
      setRequests(res.data.data || [])
    } catch {
      toast.error('Failed to fetch leave requests')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleResponse = async (id, status) => {
    setActionLoading(id)
    try {
      await api.post('/leaves/admin/respond', { id, status, adminNotes: adminNote })
      toast.success(`Request ${status.toLowerCase()} successfully`)
      setNoteModal(null)
      setAdminNote('')
      fetchRequests()
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    return !q || r.staff?.fullName?.toLowerCase().includes(q) || r.staff?.employeeId?.toLowerCase().includes(q)
  })

  const leaveStatusPill = s => {
    if (s === 'Approved') return <span className="la-pill la-pill-green">Approved</span>
    if (s === 'Rejected') return <span className="la-pill la-pill-red">Rejected</span>
    return <span className="la-pill la-pill-orange">Pending</span>
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="la-search" style={{ flex:'1 1 260px' }}>
          <Search size={15} />
          <input placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['All','Pending','Approved','Rejected'].map(s => (
            <button key={s} className="la-filter-btn"
              onClick={() => setFilterStatus(s)}
              style={{ background: filterStatus === s ? 'var(--primary)' : 'var(--surface)', color: filterStatus === s ? '#fff' : 'var(--text-muted)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <Loader2 size={30} className="animate-spin" style={{ color:'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:64, background:'var(--surface)', borderRadius:12, border:'1px dashed var(--border)' }}>
          <Calendar size={40} color="var(--text-light)" style={{ marginBottom:12 }} />
          <div style={{ fontWeight:700, color:'var(--text)', marginBottom:6 }}>No requests found</div>
          <div style={{ color:'var(--text-muted)', fontSize:13 }}>Try changing the status filter or search term.</div>
        </div>
      ) : (
        <div className="la-card">
          {/* Table head */}
          <div className="la-table-head" style={{ gridTemplateColumns:'1.6fr 1fr 2fr 100px 90px' }}>
            {['Employee','Dates','Reason','Balances','Status'].map(h => (
              <div key={h} style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</div>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {filtered.map(req => {
              const days = Math.max(1, Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / 86400000) + 1)
              return (
                <motion.div key={req._id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="la-row" style={{ gridTemplateColumns:'1.6fr 1fr 2fr 100px 90px' }}>

                  {/* Employee */}
                  <div style={{ display:'flex', gap:11, alignItems:'center', minWidth:0 }}>
                    <Avatar name={req.staff?.fullName} size={38} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{req.staff?.fullName}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{req.staff?.employeeId || '—'} · <span style={{ color:'var(--primary)', fontWeight:600 }}>{req.type} Leave</span></div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ fontSize:12, color:'var(--text)' }}>
                    <div style={{ fontWeight:600 }}>{fmtDate(req.startDate)}</div>
                    <div style={{ color:'var(--text-muted)', marginTop:2 }}>to {fmtDate(req.endDate)}</div>
                    <div style={{ marginTop:4 }}><span className="la-pill la-pill-slate">{days} day{days !== 1 ? 's' : ''}</span></div>
                  </div>

                  {/* Reason */}
                  <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.45, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {req.reason || '—'}
                  </div>

                  {/* Balances */}
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>
                    <div>CL: <span style={{ color:'var(--primary)' }}>{req.staff?.leaveBalance?.casual ?? 0}d</span></div>
                    <div style={{ marginTop:3 }}>SL: <span style={{ color:'var(--primary)' }}>{req.staff?.leaveBalance?.sick ?? 0}d</span></div>
                  </div>

                  {/* Status / Action */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    {leaveStatusPill(req.status)}
                    {req.status === 'Pending' && (
                      <button onClick={() => setNoteModal(req._id)} className="btn-primary"
                        style={{ padding:'5px 12px', fontSize:12, borderRadius:7 }}>
                        Review
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Decision Modal */}
      <AnimatePresence>
        {noteModal && (() => {
          const req = requests.find(r => r._id === noteModal)
          return (
            <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)' }}
                onClick={() => { setNoteModal(null); setAdminNote('') }} />
              <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
                className="card" style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Review Leave Request</div>
                  {req && (
                    <div style={{ fontSize:13, color:'var(--text-muted)' }}>
                      <strong style={{ color:'var(--text)' }}>{req.staff?.fullName}</strong> · {req.type} Leave · {fmtDate(req.startDate)} – {fmtDate(req.endDate)}
                    </div>
                  )}
                </div>
                <textarea
                  placeholder="Add a note for the employee (optional)…"
                  value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  className="input-field"
                  style={{ width:'100%', height:110, padding:12, resize:'none', fontSize:13, marginBottom:20 }}
                />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <button onClick={() => handleResponse(noteModal, 'Rejected')} disabled={actionLoading === noteModal}
                    className="btn-secondary" style={{ height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    {actionLoading === noteModal ? <Loader2 size={18} className="animate-spin" /> : <><XCircle size={17} /> Deny</>}
                  </button>
                  <button onClick={() => handleResponse(noteModal, 'Approved')} disabled={actionLoading === noteModal}
                    className="btn-primary" style={{ height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    {actionLoading === noteModal ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={17} /> Approve</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
function AttendanceTab() {
  const now   = new Date()
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [year, setYear]       = useState(now.getFullYear())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/attendance/admin/monthly', { params: { month, year } })
      setRecords(res.data.data || [])
    } catch {
      toast.error('Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    return !q || r.staff?.fullName?.toLowerCase().includes(q) || r.staff?.employeeId?.toLowerCase().includes(q)
  })

  // Summary stats
  const totalRecords  = filtered.length
  const fullDays      = filtered.filter(r => r.workStatus === 'Full Day').length
  const halfDays      = filtered.filter(r => r.workStatus === 'Half Day').length
  const lateArrivals  = filtered.filter(r => isLate(r.punchIn)).length
  const totalHrsAll   = filtered.reduce((s, r) => s + (r.totalHours || 0), 0)
  const avgHrs        = totalRecords ? totalHrsAll / totalRecords : 0

  // CSV export
  const exportCSV = () => {
    const rows = [['Date','Employee','Employee ID','Designation','Login Time','Punch In Location','Punch Out','Punch Out Location','Hours Worked','Status','Late']]
    filtered.forEach(r => {
      const locIn  = r.locationIn?.lat  ? `${r.locationIn.lat},${r.locationIn.lng}`   : 'N/A'
      const locOut = r.locationOut?.lat ? `${r.locationOut.lat},${r.locationOut.lng}` : 'N/A'
      rows.push([
        fmtDate(r.date),
        r.staff?.fullName || 'N/A',
        r.staff?.employeeId || 'N/A',
        r.staff?.designation || 'N/A',
        fmtTime(r.punchIn),
        locIn,
        fmtTime(r.punchOut),
        locOut,
        r.totalHours ? r.totalHours.toFixed(2) : '0',
        r.workStatus || r.status || '—',
        isLate(r.punchIn) ? 'Yes' : 'No'
      ])
    })
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Attendance_${MONTHS[month - 1]}_${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const yearOptions = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i)

  return (
    <div>
      {/* Controls bar */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {/* Month nav */}
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'3px 6px' }}>
          <button onClick={prevMonth} style={{ border:'none', background:'none', cursor:'pointer', padding:'4px 6px', borderRadius:6, color:'var(--text)' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--text)', minWidth:110, textAlign:'center' }}>
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            style={{ border:'none', background:'none', cursor: isCurrentMonth ? 'default' : 'pointer', padding:'4px 6px', borderRadius:6, color: isCurrentMonth ? 'var(--text-light)' : 'var(--text)', opacity: isCurrentMonth ? 0.4 : 1 }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Year select */}
        <select className="la-month-select" value={year} onChange={e => setYear(Number(e.target.value))}>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Search */}
        <div className="la-search" style={{ flex:'1 1 200px' }}>
          <Search size={14} />
          <input placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Export */}
        <button className="la-export-btn" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:20 }}>
        {[
          { icon: ClipboardList, label:'Total Records', value: totalRecords,           iconBg:'#eff6ff', iconColor:'#1d4ed8' },
          { icon: UserCheck,     label:'Full Days',     value: fullDays,               iconBg:'#f0fdf4', iconColor:'#15803d' },
          { icon: Clock,         label:'Half Days',     value: halfDays,               iconBg:'#fefce8', iconColor:'#854d0e' },
          { icon: AlertTriangle, label:'Late Arrivals', value: lateArrivals,           iconBg:'#fff7ed', iconColor:'#c2410c' },
          { icon: TrendingUp,    label:'Avg Hrs/Day',   value: `${avgHrs.toFixed(1)}h`,iconBg:'#faf5ff', iconColor:'#6b21a8' },
        ].map(({ icon: Icon, label, value, iconBg, iconColor }) => (
          <div key={label} className="la-stat">
            <div style={{ width:38, height:38, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={18} color={iconColor} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', lineHeight:1.15, marginTop:2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <Loader2 size={30} className="animate-spin" style={{ color:'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:64, background:'var(--surface)', borderRadius:12, border:'1px dashed var(--border)' }}>
          <ClipboardList size={40} color="var(--text-light)" style={{ marginBottom:12 }} />
          <div style={{ fontWeight:700, color:'var(--text)', marginBottom:6 }}>No attendance records</div>
          <div style={{ color:'var(--text-muted)', fontSize:13 }}>No data found for {MONTHS[month - 1]} {year}.</div>
        </div>
      ) : (
        <div className="la-card">
          {/* Head */}
          <div className="la-table-head" style={{ gridTemplateColumns:'40px 1.8fr 110px 90px 90px 90px 80px' }}>
            {['','Employee','Date','Login','Punch Out','Worked','Status'].map((h, i) => (
              <div key={i} style={{ fontSize:11, fontWeight:700, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ maxHeight:500, overflowY:'auto' }}>
            <div style={{ '--scrollbar-w':'4px' }}>
              {filtered.map((record, idx) => {
                const late   = isLate(record.punchIn)
                const active = !record.punchOut
                const avatarBg = late ? '#fff7ed' : active ? '#eff6ff' : '#f0fdf4'
                const avatarColor = late ? '#c2410c' : active ? '#1d4ed8' : '#15803d'

                return (
                  <motion.div key={record._id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="la-row" style={{ gridTemplateColumns:'40px 1.8fr 110px 90px 90px 90px 80px' }}>

                    {/* Row number */}
                    <div style={{ fontSize:11, color:'var(--text-light)', fontWeight:500 }}>{idx + 1}</div>

                    {/* Employee */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                      <Avatar name={record.staff?.fullName} size={34} bg={avatarBg} color={avatarColor} />
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {record.staff?.fullName || 'Unknown'}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>
                          {record.staff?.designation || 'Staff'} · {record.staff?.employeeId || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>
                      {fmtDateShort(record.date)}
                    </div>

                    {/* Login + location */}
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color: late ? '#c2410c' : 'var(--text)' }}>
                        {fmtTime(record.punchIn)}
                      </div>
                      {late && <div style={{ fontSize:10, color:'#c2410c', fontWeight:500, marginTop:1 }}>Late</div>}
                      {record.locationIn?.lat && record.locationIn?.lng ? (
                        <a
                          className="la-map-link"
                          href={`https://www.google.com/maps?q=${record.locationIn.lat},${record.locationIn.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin size={10} />
                          {Number(record.locationIn.lat).toFixed(4)}, {Number(record.locationIn.lng).toFixed(4)}
                        </a>
                      ) : (
                        <div style={{ fontSize:10, color:'var(--text-light)', marginTop:2 }}>No location</div>
                      )}
                    </div>

                    {/* Punch out + location */}
                    <div>
                      {active
                        ? <span className="la-pill la-pill-blue" style={{ fontSize:10 }}>Active</span>
                        : (
                          <>
                            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{fmtTime(record.punchOut)}</div>
                            {record.locationOut?.lat && record.locationOut?.lng ? (
                              <a
                                className="la-map-link"
                                href={`https://www.google.com/maps?q=${record.locationOut.lat},${record.locationOut.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MapPin size={10} />
                                {Number(record.locationOut.lat).toFixed(4)}, {Number(record.locationOut.lng).toFixed(4)}
                              </a>
                            ) : (
                              <div style={{ fontSize:10, color:'var(--text-light)', marginTop:2 }}>No location</div>
                            )}
                          </>
                        )
                      }
                    </div>

                    {/* Worked */}
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
                      {record.totalHours ? fmtHours(record.totalHours) : active ? <span style={{ fontSize:11, color:'var(--text-muted)' }}>In progress</span> : '—'}
                      {record.overtimeHours > 0 && (
                        <div style={{ fontSize:10, color:'#6b21a8', marginTop:1 }}>+{fmtHours(record.overtimeHours)} OT</div>
                      )}
                    </div>

                    {/* Status */}
                    <StatusPill status={record.status} workStatus={active ? 'Active' : record.workStatus} />
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding:'11px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:20, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>Total: <strong style={{ color:'var(--text)' }}>{filtered.length} records</strong></span>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>Hours: <strong style={{ color:'var(--text)' }}>{totalHrsAll.toFixed(1)}h</strong></span>
              {lateArrivals > 0 && <span style={{ fontSize:12, color:'var(--text-muted)' }}>Late: <strong style={{ color:'#c2410c' }}>{lateArrivals}</strong></span>}
            </div>
            <button className="la-export-btn" onClick={exportCSV} style={{ fontSize:12, padding:'6px 14px' }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeaveRequests() {
  const [activeTab, setActiveTab] = useState('leave')

  useEffect(() => {
    const id = 'la-page-styles'
    if (!document.getElementById(id)) {
      const el = document.createElement('style')
      el.id = id
      el.innerHTML = pageStyles
      document.head.appendChild(el)
    }
    return () => { const el = document.getElementById(id); if (el) el.remove() }
  }, [])

  return (
    <div style={{ padding:'24px clamp(16px, 4vw, 32px)', maxWidth:'var(--container-max)', margin:'0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom:22 }}>
        <h2 style={{ margin:0, fontSize:21, fontWeight:700, color:'var(--text)' }}>Leave & Attendance</h2>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>
          Review leave applications and monthly attendance records.
        </div>
      </div>

      {/* Tabs */}
      <div className="la-tabs" style={{ marginBottom:22 }}>
        <button className={`la-tab${activeTab === 'leave' ? ' active' : ''}`} onClick={() => setActiveTab('leave')}>
          <Calendar size={14} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />
          Leave Requests
        </button>
        <button className={`la-tab${activeTab === 'attendance' ? ' active' : ''}`} onClick={() => setActiveTab('attendance')}>
          <ClipboardList size={14} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />
          Attendance
        </button>
      </div>

      {activeTab === 'leave'      && <LeaveTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
    </div>
  )
}
