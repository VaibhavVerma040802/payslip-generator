import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Eye, Download, Mail, Trash2, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = ['', ...Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)]

function EmptyState({ filtered }) {
  return (
    <tr>
      <td colSpan={7}>
        <div style={{ padding: '56px 24px', textAlign: 'center' }}>
          <FileText size={44} color="var(--border)" style={{ margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            {filtered ? 'No payslips match your filters' : 'No payslips yet'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
            {filtered ? 'Try adjusting your search or filters.' : 'Generate your first payslip to get started.'}
          </div>
        </div>
      </td>
    </tr>
  )
}

function ActionBtn({ icon: Icon, label, onClick, color = 'var(--text-muted)', loading }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      title={label}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, border: 'none', borderRadius: 7,
        background: 'transparent', cursor: loading ? 'wait' : 'pointer',
        color, transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={14} />}
    </button>
  )
}

export default function PayslipList() {
  const navigate = useNavigate()
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [actionLoading, setActionLoading] = useState({})
  const [deleting, setDeleting] = useState(null)

  const fetchPayslips = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      if (filterMonth) params.set('month', filterMonth)
      if (filterYear) params.set('year', filterYear)
      const res = await api.get(`/payslips?${params}`)
      setPayslips(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      toast.error('Failed to load payslips')
    } finally {
      setLoading(false)
    }
  }, [search, filterMonth, filterYear, page])

  useEffect(() => {
    const timer = setTimeout(fetchPayslips, search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [fetchPayslips])

  const handleDownload = async (id, name, month, year) => {
    setActionLoading(a => ({ ...a, [`dl_${id}`]: true }))
    try {
      const res = await api.get(`/payslips/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `Payslip_${name.replace(/\s+/g,'_')}_${month}_${year}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error('Download failed')
    } finally {
      setActionLoading(a => ({ ...a, [`dl_${id}`]: false }))
    }
  }

  const handleEmail = async (id, email) => {
    setActionLoading(a => ({ ...a, [`em_${id}`]: true }))
    try {
      await api.post(`/payslips/${id}/email`)
      toast.success(`Payslip emailed to ${email}`)
      fetchPayslips()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(a => ({ ...a, [`em_${id}`]: false }))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payslip? This cannot be undone.')) return
    setDeleting(id)
    try {
      await api.delete(`/payslips/${id}`)
      toast.success('Payslip deleted')
      fetchPayslips()
    } catch (err) {
      toast.error('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const isFiltered = search || filterMonth || filterYear

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 26, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>
            All Payslips
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {pagination.total} payslip{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => navigate('/generate')}
          style={{
            background: 'var(--navy)', color: 'white', border: 'none',
            borderRadius: 10, padding: '10px 20px', fontWeight: 600,
            fontSize: 13.5, cursor: 'pointer',
          }}
        >
          + New Payslip
        </button>
      </div>

      {/* Filters */}
      <div className="fade-up" style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', padding: '16px 20px',
        marginBottom: 20, boxShadow: 'var(--shadow-sm)',
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, ID, department..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: '1.5px solid var(--border)', borderRadius: 8,
              fontSize: 13.5, color: 'var(--text)', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--navy)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Month filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} color="var(--text-muted)" />
          <select
            value={filterMonth}
            onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
            style={{
              border: '1.5px solid var(--border)', borderRadius: 8,
              padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Months</option>
            {MONTHS.slice(1).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Year filter */}
        <select
          value={filterYear}
          onChange={e => { setFilterYear(e.target.value); setPage(1) }}
          style={{
            border: '1.5px solid var(--border)', borderRadius: 8,
            padding: '8px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">All Years</option>
          {YEARS.slice(1).map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {isFiltered && (
          <button
            onClick={() => { setSearch(''); setFilterMonth(''); setFilterYear(''); setPage(1) }}
            style={{
              background: 'var(--red-light)', color: 'var(--red)',
              border: 'none', borderRadius: 8, padding: '8px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="fade-up" style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--navy)' }}>
              {['Employee', 'ID', 'Department', 'Period', 'Net Salary', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '13px 16px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, color: 'var(--gold)',
                  letterSpacing: 0.5, textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div className="skeleton" style={{ height: 16, width: j === 0 ? 140 : j === 4 ? 90 : 80, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : payslips.length === 0 ? (
              <EmptyState filtered={!!isFiltered} />
            ) : (
              payslips.map((p, idx) => (
                <tr
                  key={p._id}
                  onClick={() => navigate(`/payslips/${p._id}`)}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background 0.12s',
                    background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'}
                >
                  {/* Employee */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: 'var(--navy)', color: 'var(--gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {p.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>{p.employeeName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.designation}</div>
                      </div>
                    </div>
                  </td>

                  {/* ID */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {p.employeeId}
                  </td>

                  {/* Department */}
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-navy">{p.department}</span>
                  </td>

                  {/* Period */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {p.month} {p.year}
                  </td>

                  {/* Net Salary */}
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--navy)', fontSize: 14, whiteSpace: 'nowrap' }}>
                    {fmt(p.netSalary)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    {p.emailSent
                      ? <span className="badge badge-green">✓ Emailed</span>
                      : <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>Pending</span>
                    }
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <ActionBtn icon={Eye} label="View" onClick={() => navigate(`/payslips/${p._id}`)} color="var(--navy)" />
                      <ActionBtn
                        icon={Download} label="Download PDF"
                        loading={actionLoading[`dl_${p._id}`]}
                        onClick={() => handleDownload(p._id, p.employeeName, p.month, p.year)}
                        color="var(--green)"
                      />
                      <ActionBtn
                        icon={Mail} label="Send Email"
                        loading={actionLoading[`em_${p._id}`]}
                        onClick={() => handleEmail(p._id, p.employeeEmail)}
                        color="#0284c7"
                      />
                      <ActionBtn
                        icon={Trash2} label="Delete"
                        loading={deleting === p._id}
                        onClick={() => handleDelete(p._id)}
                        color="var(--red)"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px', border: '1.5px solid var(--border)',
                  borderRadius: 7, background: 'var(--surface)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? 'var(--text-light)' : 'var(--text)', fontSize: 13,
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  style={{
                    width: 34, height: 34, border: '1.5px solid',
                    borderColor: page === i + 1 ? 'var(--navy)' : 'var(--border)',
                    borderRadius: 7, fontSize: 13, fontWeight: page === i + 1 ? 700 : 400,
                    background: page === i + 1 ? 'var(--navy)' : 'var(--surface)',
                    color: page === i + 1 ? 'white' : 'var(--text)', cursor: 'pointer',
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                disabled={page === pagination.totalPages}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px', border: '1.5px solid var(--border)',
                  borderRadius: 7, background: 'var(--surface)',
                  cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  color: page === pagination.totalPages ? 'var(--text-light)' : 'var(--text)', fontSize: 13,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
