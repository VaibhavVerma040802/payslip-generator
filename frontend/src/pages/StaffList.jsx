import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Briefcase, ChevronRight, X, Loader2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

function InputField({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
        {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '12px 14px', border: '2px solid var(--border)', borderRadius: 12,
          fontSize: 14, color: 'var(--text)', background: 'var(--surface)',
          outline: 'none', transition: 'all 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

export default function StaffList() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '', employeeId: '', email: '', phone: '', designation: '', department: '',
    type: 'Employee', joiningDate: '', panNumber: '', bankName: '',
    accountNumber: '', ifscCode: '', annualCTC: '', baseSalary: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const res = await api.get('/staff')
      setStaff(res.data.data)
    } catch (err) {
      toast.error('Failed to fetch staff data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        financials: {
          panNumber: formData.panNumber, bankName: formData.bankName,
          accountNumber: formData.accountNumber, ifscCode: formData.ifscCode
        },
        salaryDetails: {
          annualCTC: parseFloat(formData.annualCTC) || 0,
          baseSalary: parseFloat(formData.baseSalary) || 0
        }
      }
      const res = await api.post('/staff', payload)
      setStaff([res.data.data, ...staff])
      setShowModal(false)
      toast.success('Staff member added successfully')
      setFormData({
        fullName: '', employeeId: '', email: '', phone: '', designation: '', department: '',
        type: 'Employee', joiningDate: '', panNumber: '', bankName: '',
        accountNumber: '', ifscCode: '', annualCTC: '', baseSalary: ''
      })
    } catch (err) {
      toast.error(err.message || 'Failed to add staff')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          s.email.toLowerCase().includes(search.toLowerCase()) ||
                          s.designation?.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'All' || s.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: 1400, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}>
        <div>
          <h1 style={{ color: 'var(--navy)', marginBottom: 8, fontSize: 28, letterSpacing: '-0.02em' }}>Staff Management</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Manage your regular employees and interns.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--navy)', color: 'white',
            border: 'none', borderRadius: 14, padding: '14px 28px',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)',
            transition: 'all 0.3s',
          }}
          className="btn-hover"
        >
          <Plus size={18} strokeWidth={3} /> Add New Staff
        </button>
      </header>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text" placeholder="Search staff members..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 44px', border: '2px solid var(--border)', 
              borderRadius: 14, background: 'var(--surface)', fontSize: 14, fontWeight: 500,
              outline: 'none', color: 'var(--text)'
            }}
          />
        </div>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 14, padding: 4 }}>
          {['All', 'Employee', 'Intern'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: filterType === type ? 'var(--navy)' : 'transparent',
                color: filterType === type ? 'white' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="animate-spin text-muted" /></div>
      ) : filteredStaff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface)', borderRadius: 24, border: '1px dashed var(--border)' }}>
          <Briefcase size={48} color="var(--text-light)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No staff members found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria or add a new staff member.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredStaff.map((person, i) => (
            <motion.div
              key={person._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/staff/${person._id}`)}
              style={{
                background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
              }}
              className="hover:border-gold hover:-translate-y-1"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: person.type === 'Employee' ? 'var(--navy)' : 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 800 }}>
                    {person.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--navy)' }}>{person.fullName}</h3>
                    <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>{person.employeeId}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{person.designation || 'No designation'}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <span className={`badge ${person.type === 'Employee' ? 'badge-navy' : 'badge-emerald'}`}>{person.type}</span>
                <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{person.department || 'General'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {person.type === 'Employee' ? 'CTC: ₹' + (person.salaryDetails?.annualCTC?.toLocaleString() || 0) : 'Stipend: ₹' + (person.salaryDetails?.baseSalary?.toLocaleString() || 0)}
                </div>
                <ChevronRight size={18} color="var(--text-light)" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--navy)' }}>Add New Staff Member</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={24} /></button>
              </div>
              
              <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
                <form id="addStaffForm" onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 24, background: 'var(--bg)', padding: 6, borderRadius: 16 }}>
                    {['Employee', 'Intern'].map(type => (
                      <button 
                        key={type} type="button" onClick={() => setFormData({ ...formData, type })}
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontWeight: 700,
                          background: formData.type === type ? 'var(--surface)' : 'transparent',
                          color: formData.type === type ? 'var(--navy)' : 'var(--text-muted)',
                          boxShadow: formData.type === type ? 'var(--shadow-sm)' : 'none', cursor: 'pointer'
                        }}
                      >{type}</button>
                    ))}
                  </div>

                  <h4 style={{ color: 'var(--navy)', marginBottom: 16 }}>Professional Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                    <InputField label="Employee ID / Code" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required />
                    <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                    <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required />
                    <InputField label="Joining Date" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
                    <InputField label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} required />
                    <InputField label="Department" name="department" value={formData.department} onChange={handleInputChange} required />
                  </div>

                  <h4 style={{ color: 'var(--navy)', marginTop: 24, marginBottom: 16 }}>Financial Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleInputChange} required />
                    <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} required />
                    <InputField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required />
                    <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required />
                  </div>

                  <h4 style={{ color: 'var(--navy)', marginTop: 24, marginBottom: 16 }}>Salary Structure</h4>
                  {formData.type === 'Employee' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                      <InputField label="Annual CTC (in ₹)" type="number" name="annualCTC" value={formData.annualCTC} onChange={handleInputChange} required />
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Note: For Regular Employees, the payslip engine derived HRA, PF, etc., automatically from the CTC.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                      <InputField label="Monthly Stipend (Base Salary)" type="number" name="baseSalary" value={formData.baseSalary} onChange={handleInputChange} required />
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Note: For Interns, this base amount is used to calculate the final stipend after absence deductions.</p>
                    </div>
                  )}
                </form>
              </div>

              <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', borderRadius: 12, border: '2px solid var(--border)', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" form="addStaffForm" disabled={submitting} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--navy)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Save Staff Member'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
