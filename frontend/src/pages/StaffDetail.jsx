import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, Landmark, CreditCard, Trash2, Code, FileText, Loader2, IndianRupee, Key, Ban, Shield, FileDigit } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      {Icon && <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Icon size={18} /></div>}
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{value || '—'}</div>
      </div>
    </div>
  )
}

export default function StaffDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const [attendance, setAttendance] = useState([])
  const [provisioning, setProvisioning] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [savingOT, setSavingOT] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/staff/${id}`)
        setStaff(res.data.data)
        
        // Fetch attendance for admin
        try {
          const attRes = await api.get(`/attendance/admin/staff/${id}`)
          setAttendance(attRes.data.history)
        } catch (attErr) {
          console.error("Failed to load attendance", attErr)
        }
      } catch (err) {
        toast.error('Failed to load staff details')
        navigate('/staff')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, navigate])

  const handleProvision = async () => {
    setProvisioning(true)
    setTempPassword('')
    try {
      const res = await api.post(`/staff/${id}/provision-portal`)
      toast.success(res.data.message || 'Portal provisioned')
      if (res.data.tempPassword) {
        setTempPassword(res.data.tempPassword)
      }
      // Refresh staff to show active state
      const staffRes = await api.get(`/staff/${id}`)
      setStaff(staffRes.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to provision portal')
    } finally {
      setProvisioning(false)
    }
  }

  const handleRevoke = async () => {
    if (!window.confirm('Are you sure you want to revoke portal access for this staff member?')) return
    setRevoking(true)
    try {
      await api.delete(`/staff/${id}/revoke-portal`)
      toast.success('Portal access revoked')
      setTempPassword('')
      // Refresh staff to show inactive state
      const staffRes = await api.get(`/staff/${id}`)
      setStaff(staffRes.data.data)
    } catch (err) {
      toast.error('Failed to revoke access')
    } finally {
      setRevoking(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${staff.fullName}?`)) return
    setDeleting(true)
    try {
      await api.delete(`/staff/${id}`)
      toast.success('Staff member deleted')
      navigate('/staff')
    } catch (err) {
      toast.error('Failed to delete')
      setDeleting(false)
    }
  }

  const handleToggleOvertimeEligible = async () => {
    setSavingOT(true)
    try {
      const res = await api.put(`/staff/${id}`, { overtimeEligible: !staff.overtimeEligible })
      setStaff(res.data.data)
      toast.success(`Weekend overtime ${!staff.overtimeEligible ? 'enabled' : 'disabled'}`)
    } catch (err) {
      toast.error('Failed to update overtime eligibility')
    } finally {
      setSavingOT(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Loader2 size={40} className="animate-spin text-muted" /></div>
  if (!staff) return null

  const isIntern = staff.type === 'Intern'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: 1000, margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/staff')} 
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}
      >
        <ArrowLeft size={18} /> Back to Staff
      </button>

      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
        {/* Header Profile Area */}
        <div style={{ padding: 40, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 12, background: staff.type === 'Employee' ? 'var(--primary)' : 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 800 }}>
              {staff.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: 24, marginBottom: 8 }}>{staff.fullName}</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className={`badge ${staff.type === 'Employee' ? 'badge-navy' : 'badge-emerald'}`}>{staff.type}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{staff.designation || 'No Designation'} · {staff.department || 'General'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!staff.isPortalEnabled ? (
              <button onClick={handleProvision} disabled={provisioning} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--emerald)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                {provisioning ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                Grant Portal Access
              </button>
            ) : (
              <button onClick={handleRevoke} disabled={revoking} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                {revoking ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                Revoke Access
              </button>
            )}
            <button onClick={handleDelete} disabled={deleting} style={{ padding: '10px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </div>

        <div style={{ padding: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
          {/* Professional Details */}
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Professional Details</h3>
            <DetailRow icon={Code} label="Employee ID / Code" value={staff.employeeId} />
            <DetailRow icon={Mail} label="Email Address" value={staff.email} />
            <DetailRow icon={Phone} label="Phone Number" value={staff.phone} />
            <DetailRow icon={Briefcase} label="Department" value={staff.department} />
            <DetailRow icon={Calendar} label="Date of Joining" value={staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : ''} />
            {staff.pfNumber && <DetailRow icon={FileDigit} label="PF Number" value={staff.pfNumber} />}

            {/* Overtime / Weekend Eligibility Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Shield size={18} /></div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>WEEKEND OVERTIME</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{staff.overtimeEligible ? 'Allowed (Sat/Sun work permitted)' : 'Not Eligible (Sat/Sun Off)'}</div>
                </div>
              </div>
              <button
                onClick={handleToggleOvertimeEligible}
                disabled={savingOT}
                style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: staff.overtimeEligible ? 'var(--bg)' : 'var(--primary)', color: staff.overtimeEligible ? 'var(--primary)' : '#ffffff' }}
              >
                {savingOT ? <Loader2 size={14} className="animate-spin" style={{ display: 'inline' }} /> : (staff.overtimeEligible ? 'Disable' : 'Enable')}
              </button>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Financial Information</h3>
            <DetailRow icon={CreditCard} label="PAN Number" value={staff.financials?.panNumber} />
            <DetailRow icon={Landmark} label="Bank Name" value={staff.financials?.bankName} />
            <DetailRow icon={Code} label="Account Number" value={staff.financials?.accountNumber} />
            <DetailRow icon={Code} label="IFSC Code" value={staff.financials?.ifscCode} />
          </div>
          
          {/* Salary */}
          <div>
            <h3 style={{ color: 'var(--primary)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Salary Structure</h3>
            {isIntern ? (
              <DetailRow icon={IndianRupee} label="Monthly Stipend (Base Salary)" value={`₹ ${staff.salaryDetails?.baseSalary?.toLocaleString() || 0}`} />
            ) : (
              <DetailRow icon={IndianRupee} label="Annual CTC" value={`₹ ${staff.salaryDetails?.annualCTC?.toLocaleString() || 0}`} />
            )}
             <div style={{ marginTop: 24, padding: 16, background: 'var(--bg)', borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {isIntern ? "Intern payslips will be generated based on this monthly stipend amount. Absence deductions are applied automatically in the generator." : "Employee payslips (Basic, HRA, PF, PT, etc.) are automatically derived from this Annual CTC figure during generation."}
                </p>
             </div>
          </div>
        </div>

        {/* Portal Access Management */}
        <div style={{ padding: '0 40px 40px' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Staff Portal Access</h3>
          <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h4 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Portal Status:</h4>
                {staff.isPortalEnabled ? (
                  <span className="badge badge-emerald">Active</span>
                ) : (
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Disabled</span>
                )}
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
                {staff.isPortalEnabled 
                  ? 'This staff member can log in to the Staff Portal to track attendance.' 
                  : 'Enable portal access to allow this staff member to log their attendance.'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              {!staff.isPortalEnabled ? (
                  <button onClick={handleProvision} disabled={provisioning} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {provisioning ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                    Provision Access
                  </button>
              ) : (
                  <button onClick={handleRevoke} disabled={revoking} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {revoking ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                    Revoke Access
                  </button>
              )}
            </div>
          </div>
          
          {tempPassword && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--bg)', border: '1px solid var(--primary)', borderRadius: 12, color: 'var(--primary)' }}>
              <strong>Temporary Password Generated:</strong> <span style={{ fontFamily: 'monospace', fontSize: 18, marginLeft: 8, letterSpacing: 2 }}>{tempPassword}</span>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Please share this securely with the staff member if the email fails to deliver.</p>
            </div>
          )}
        </div>

        {/* Attendance History (Admin View) */}
        {staff.isPortalEnabled && (
          <div style={{ padding: '0 40px 40px' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Recent Attendance (Last 30 Days)</h3>
            {attendance.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', background: 'var(--bg)', borderRadius: 12, color: 'var(--text-muted)' }}>
                No recent attendance records found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', background: 'var(--bg)', borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: 16, color: 'var(--text-muted)', fontWeight: 600 }}>In</th>
                      <th style={{ padding: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Out</th>
                      <th style={{ padding: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Total Hours</th>
                      <th style={{ padding: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 16, fontWeight: 500, color: 'var(--text)' }}>
                          {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: 16, color: 'var(--text-muted)' }}>
                          {record.punchIn ? new Date(record.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </td>
                        <td style={{ padding: 16, color: 'var(--text-muted)' }}>
                          {record.punchOut ? new Date(record.punchOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </td>
                        <td style={{ padding: 16, color: 'var(--text-muted)' }}>
                          {record.totalHours > 0 ? `${record.totalHours.toFixed(2)}h` : '-'}
                          {record.overtimeHours > 0 && <span style={{ marginLeft: 8, color: 'var(--primary)', fontSize: 12 }}>+{record.overtimeHours.toFixed(2)}h OT</span>}
                        </td>
                        <td style={{ padding: 16 }}>
                          {record.punchIn && record.punchOut ? (
                            <span className={`badge ${
                              record.workStatus === 'Full Day' ? 'badge-emerald' :
                              record.workStatus === 'Half Day' ? 'badge-navy' :
                              record.workStatus === 'LOP' ? 'badge-red' : 'badge-navy'
                            }`}>
                              {record.workStatus || 'Complete'}
                            </span>
                          ) : record.punchIn ? (
                            <span className="badge" style={{ background: 'var(--bg)', color: 'var(--primary)' }}>Active</span>
                          ) : (
                            <span className="badge" style={{ background: 'var(--text)', color: '#ffffff' }}>Absent</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Leave History (Pending/Approved/Rejected) */}
        <div style={{ padding: '0 40px 40px' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Leave History</h3>
          <LeaveHistoryList staffId={id} />
        </div>

      </div>
    </motion.div>
  )
}

function LeaveHistoryList({ staffId }) {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        // We'll use the existing my-requests endpoint if we can modify it to allow admin to pass staffId
        // Or better, let's assume we have a new endpoint /api/leaves/admin/staff/:id
        const res = await api.get(`/leaves/admin/pending?staffId=${staffId}`) 
        // Note: the pending endpoint currently returns ALL pending. 
        // I'll need to update the backend to support filtering by staffId.
        setLeaves(res.data.data.filter(l => l.staff._id === staffId || l.staff === staffId))
      } catch (err) {
        console.error("Failed to load leaves", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaves()
  }, [staffId])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader2 size={24} className="animate-spin text-muted" /></div>
  if (leaves.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 12 }}>No leave records found.</div>

  return (
    <div style={{ overflowX: 'auto', background: 'var(--bg)', borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: 12, fontWeight: 600 }}>Type</th>
            <th style={{ padding: 12, fontWeight: 600 }}>Period</th>
            <th style={{ padding: 12, fontWeight: 600 }}>Status</th>
            <th style={{ padding: 12, fontWeight: 600 }}>Reason</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map(l => (
            <tr key={l._id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: 12, fontWeight: 700 }}>{l.type}</td>
              <td style={{ padding: 12 }}>
                {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
              </td>
              <td style={{ padding: 12 }}>
                <span className={`badge ${l.status === 'Approved' ? 'badge-emerald' : l.status === 'Rejected' ? 'badge-red' : 'badge-navy'}`}>
                  {l.status}
                </span>
              </td>
              <td style={{ padding: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.reason}>
                {l.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
