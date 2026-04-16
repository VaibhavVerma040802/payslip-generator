import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Phone, Briefcase, Calendar, Landmark, CreditCard, Trash2, Code, FileText, Loader2, IndianRupee } from 'lucide-react'
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

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/staff/${id}`)
        setStaff(res.data.data)
      } catch (err) {
        toast.error('Failed to load staff details')
        navigate('/staff')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, navigate])

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

      <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
        {/* Header Profile Area */}
        <div style={{ padding: 40, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: staff.type === 'Employee' ? 'var(--navy)' : 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 800 }}>
              {staff.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: 0, color: 'var(--navy)', fontSize: 24, marginBottom: 8 }}>{staff.fullName}</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className={`badge ${staff.type === 'Employee' ? 'badge-navy' : 'badge-emerald'}`}>{staff.type}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{staff.designation || 'No Designation'} · {staff.department || 'General'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/generate', { state: { predefinedStaff: staff } })} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--navy)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
               <FileText size={16} /> Generate Payslip
            </button>
            <button onClick={handleDelete} disabled={deleting} style={{ padding: '10px', borderRadius: 12, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </div>

        <div style={{ padding: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
          {/* Professional Details */}
          <div>
            <h3 style={{ color: 'var(--navy)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Professional Details</h3>
            <DetailRow icon={Mail} label="Email Address" value={staff.email} />
            <DetailRow icon={Phone} label="Phone Number" value={staff.phone} />
            <DetailRow icon={Briefcase} label="Department" value={staff.department} />
            <DetailRow icon={Calendar} label="Date of Joining" value={staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : ''} />
          </div>

          {/* Financials */}
          <div>
            <h3 style={{ color: 'var(--navy)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Financial Information</h3>
            <DetailRow icon={CreditCard} label="PAN Number" value={staff.financials?.panNumber} />
            <DetailRow icon={Landmark} label="Bank Name" value={staff.financials?.bankName} />
            <DetailRow icon={Code} label="Account Number" value={staff.financials?.accountNumber} />
            <DetailRow icon={Code} label="IFSC Code" value={staff.financials?.ifscCode} />
          </div>
          
          {/* Salary */}
          <div>
            <h3 style={{ color: 'var(--navy)', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 8, display: 'inline-block' }}>Salary Structure</h3>
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
      </div>
    </motion.div>
  )
}
