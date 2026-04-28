import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Briefcase, ChevronRight, X, Loader2, User, Mail, Phone, Key, Ban, Edit, Info, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

function InputField({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="label">
        {label}{required && <span style={{ color: 'var(--primary)' }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
        style={{ width: '100%' }}
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
  const [editingStaff, setEditingStaff] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // ID of staff being modified
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '', employeeId: '', email: '', phone: '', designation: '', department: '',
    type: 'Employee', joiningDate: '', panNumber: '', pfNumber: '', bankName: '',
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
      
      let res;
      if (editingStaff) {
        res = await api.put(`/staff/${editingStaff._id}`, payload)
        setStaff(staff.map(s => s._id === editingStaff._id ? res.data.data : s))
        toast.success('Staff details updated')
      } else {
        res = await api.post('/staff', payload)
        setStaff([res.data.data, ...staff])
        toast.success('Staff member added successfully')
      }
      
      setShowModal(false)
      setEditingStaff(null)
      resetForm()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: '', employeeId: '', email: '', phone: '', designation: '', department: '',
      type: 'Employee', joiningDate: '', panNumber: '', pfNumber: '', bankName: '',
      accountNumber: '', ifscCode: '', annualCTC: '', baseSalary: ''
    })
  }

  const handleEdit = (e, person) => {
    e.stopPropagation()
    setEditingStaff(person)
    setFormData({
      fullName: person.fullName,
      employeeId: person.employeeId,
      email: person.email,
      phone: person.phone || '',
      designation: person.designation || '',
      department: person.department || '',
      type: person.type || 'Employee',
      joiningDate: person.joiningDate ? person.joiningDate.split('T')[0] : '',
      panNumber: person.financials?.panNumber || '',
      pfNumber: person.pfNumber || '',
      bankName: person.financials?.bankName || '',
      accountNumber: person.financials?.accountNumber || '',
      ifscCode: person.financials?.ifscCode || '',
      annualCTC: person.salaryDetails?.annualCTC || '',
      baseSalary: person.salaryDetails?.baseSalary || ''
    })
    setShowModal(true)
  }

  const handleToggleAccess = async (e, person) => {
    e.stopPropagation()
    setActionLoading(person._id)
    try {
      if (person.isPortalEnabled) {
        await api.delete(`/staff/${person._id}/revoke-portal`)
        toast.success('Access revoked')
      } else {
        await api.post(`/staff/${person._id}/provision-portal`)
        toast.success('Portal access granted')
      }
      fetchStaff() // Refresh to get updated status
    } catch (err) {
      toast.error('Failed to update portal access')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleOvertime = async (e, person) => {
    e.stopPropagation()
    setActionLoading(person._id + '_ot')
    try {
      await api.put(`/staff/${person._id}`, { overtimeEligible: !person.overtimeEligible })
      toast.success(`Overtime ${!person.overtimeEligible ? 'enabled' : 'disabled'}`)
      fetchStaff()
    } catch (err) {
      toast.error('Failed to update overtime status')
    } finally {
      setActionLoading(null)
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
          <h1 style={{ color: 'var(--primary)', marginBottom: 8, fontSize: 28, letterSpacing: '-0.02em' }}>Staff Management</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Manage your regular employees and interns.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
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
            className="input-field"
            style={{ width: '100%', paddingLeft: 44 }}
          />
        </div>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 4 }}>
          {['All', 'Employee', 'Intern'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: filterType === type ? 'var(--primary)' : 'transparent',
                color: filterType === type ? (theme === 'dark' ? 'var(--bda-dark)' : '#ffffff') : 'var(--text-muted)',
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
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border)' }}>
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
              className="card"
              style={{
                cursor: 'pointer', transition: 'all 0.3s',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 20, fontWeight: 800 }}>
                    {person.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--primary)', fontWeight: 800 }}>{person.fullName}</h3>
                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 800 }}>{person.employeeId}</div>
                  </div>
                </div>
                <button 
                   onClick={(e) => handleEdit(e, person)}
                   style={{ padding: 8, borderRadius: 10, border: 'none', background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Edit size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                  <Briefcase size={14} /> {person.designation || 'No designation'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                  <Mail size={14} /> {person.email}
                </div>
                {person.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                    <Phone size={14} /> {person.phone}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                <span className={`badge ${person.type === 'Employee' ? 'badge-navy' : 'badge-emerald'}`}>{person.type}</span>
                <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{person.department || 'General'}</span>
                {person.isPortalEnabled ? (
                  <span className="badge badge-emerald">Portal Active</span>
                ) : (
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Portal Disabled</span>
                )}
                {person.overtimeEligible && (
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--primary)' }}>Overtime Enabled</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={(e) => handleToggleAccess(e, person)}
                    disabled={actionLoading === person._id}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: person.isPortalEnabled ? 'var(--bg)' : 'var(--primary)',
                      color: person.isPortalEnabled ? 'var(--primary)' : '#ffffff',
                      border: person.isPortalEnabled ? '1px solid var(--primary)' : 'none'
                    }}
                  >
                    {actionLoading === person._id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : person.isPortalEnabled ? (
                      <><Ban size={14} /> Revoke Access</>
                    ) : (
                      <><Key size={14} /> Grant Access</>
                    )}
                  </button>
                  <button 
                    onClick={(e) => handleToggleOvertime(e, person)}
                    disabled={actionLoading === person._id + '_ot'}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'var(--bg)',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)'
                    }}
                  >
                    {actionLoading === person._id + '_ot' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <><Clock size={14} /> {person.overtimeEligible ? 'Disable OT' : 'Enable OT'}</>
                    )}
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'left' }}>
                     <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>
                       {person.type === 'Employee' ? 'Annual CTC' : 'Stipend'}
                     </div>
                     <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
                       ₹{person.type === 'Employee' ? (person.salaryDetails?.annualCTC?.toLocaleString() || 0) : (person.salaryDetails?.baseSalary?.toLocaleString() || 0)}
                     </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/staff/${person._id}`)}
                    style={{
                      background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 10,
                      padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <Info size={14} /> View Details
                  </button>
                  <ChevronRight size={18} color="var(--text-light)" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--primary)' }}>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
                <button onClick={() => { setShowModal(false); setEditingStaff(null); resetForm(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={24} /></button>
              </div>
              
              <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
                <form id="addStaffForm" onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 24, background: 'var(--bg)', padding: 6, borderRadius: 12 }}>
                    {['Employee', 'Intern'].map(type => (
                      <button 
                        key={type} type="button" onClick={() => setFormData({ ...formData, type })}
                        style={{ 
                          flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontWeight: 700,
                          background: formData.type === type ? 'var(--primary)' : 'transparent',
                          color: formData.type === type ? '#ffffff' : 'var(--text-muted)',
                          boxShadow: formData.type === type ? 'var(--shadow-sm)' : 'none', cursor: 'pointer'
                        }}
                      >{type}</button>
                    ))}
                  </div>

                  <h4 style={{ color: 'var(--primary)', marginBottom: 16 }}>Professional Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                    <InputField label="Employee ID / Code" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required />
                    <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                    <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required />
                    <InputField label="Joining Date" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
                    <InputField label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} required />
                    <InputField label="Department" name="department" value={formData.department} onChange={handleInputChange} required />
                    <InputField label="PF Number" name="pfNumber" value={formData.pfNumber} onChange={handleInputChange} placeholder="XX/XXX/0000000" />
                  </div>

                  <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16 }}>Financial Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleInputChange} required />
                    <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} required />
                    <InputField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required />
                    <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required />
                  </div>

                  <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16 }}>Salary Structure</h4>
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
                <button type="button" onClick={() => { setShowModal(false); setEditingStaff(null); resetForm(); }} style={{ padding: '12px 24px', borderRadius: 12, border: '2px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" form="addStaffForm" disabled={submitting} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : (editingStaff ? 'Update Staff Member' : 'Save Staff Member')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
