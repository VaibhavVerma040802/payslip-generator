import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Briefcase, ChevronRight, X, Loader2, User, Mail, Phone, Key, Ban, Edit, Info, Clock, FileText, Eye, FilePlus, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import { useTheme } from '../context/ThemeContext'

function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  readOnly = false,
  hint,
  pattern,
  inputMode,
  maxLength
}) {
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
        readOnly={readOnly}
        pattern={pattern}
        inputMode={inputMode}
        maxLength={maxLength}
        className="input-field"
        style={{ width: '100%', background: readOnly ? 'var(--bg)' : 'var(--surface)', cursor: readOnly ? 'not-allowed' : 'text' }}
      />
      {hint && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>{hint}</div>
      )}
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
  const { theme } = useTheme()

  const [formData, setFormData] = useState({
    fullName: '', employeeId: '', email: '', phone: '', designation: '', department: '',
    type: 'Employee', joiningDate: '', dob: '', panNumber: '', pfNumber: '', bankName: '',
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
    const nextValue = name === 'email' ? value : value.toUpperCase()
    setFormData(prev => ({ ...prev, [name]: nextValue }))
  }

  const handlePanChange = (e) => {
    const { name, value } = e.target
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, [name]: sanitized }))
  }

  const handleAccountNumberChange = (e) => {
    const { name, value } = e.target
    const sanitized = value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, [name]: sanitized }))
  }

  const handlePhoneChange = (e) => {
    const { name, value } = e.target
    const sanitized = value.replace(/\D/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, [name]: sanitized }))
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
      type: 'Employee', joiningDate: '', dob: '', panNumber: '', pfNumber: '', bankName: '',
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
      dob: person.dob ? person.dob.split('T')[0] : '',
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
    const matchesSearch = (s.fullName?.toLowerCase() || '').includes(search.toLowerCase()) || 
                          (s.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (s.designation?.toLowerCase() || '').includes(search.toLowerCase())
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
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, padding: 4, height: 48, alignItems: 'center' }}>
            {['All', 'Employee', 'Intern'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '8px 24px', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700,
                  background: filterType === type ? 'var(--primary)' : 'transparent',
                  color: filterType === type ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  height: '100%'
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{ height: 48, padding: '0 24px', borderRadius: 6 }}
          >
            <Plus size={20} strokeWidth={2.5} /> Add new staff
          </button>
        </div>
      </header>

      <div style={{ position: 'relative', marginBottom: 32 }}>
        <Search size={20} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input 
          type="text" placeholder="Search staff members..." 
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ 
            width: '100%', border: 'none', background: 'transparent', 
            padding: '12px 0 12px 32px', fontSize: 16, color: 'var(--text)', 
            outline: 'none', borderBottom: '1px solid var(--border)' 
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={40} className="animate-spin text-muted" style={{ margin: '0 auto' }} />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border)' }}>
          <Briefcase size={48} color="var(--text-light)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No staff members found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria or add a new staff member.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 16px' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</th>
                <th style={{ padding: '0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: '0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ padding: '0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compensation</th>
                <th style={{ padding: '0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OT</th>
                <th style={{ padding: '0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((person, i) => (
                <motion.tr
                  key={person._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ 
                    background: 'var(--surface)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  }}
                >
                  {/* ... previous tds ... */}
                  <td style={{ padding: '12px', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ 
                        width: 48, height: 48, borderRadius: 12, 
                        background: person.type === 'Intern' ? '#1e40af' : '#3f6212', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#ffffff', fontSize: 16, fontWeight: 700, flexShrink: 0,
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}>
                        {person.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{person.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{person.employeeId}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{person.designation || 'No Designation'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{person.department || 'N/A'}</div>
                  </td>

                  {/* Type Badge */}
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      background: person.type === 'Intern' ? 'rgba(30, 64, 175, 0.1)' : 'rgba(63, 98, 18, 0.1)',
                      color: person.type === 'Intern' ? '#1e40af' : '#3f6212',
                      border: `1px solid ${person.type === 'Intern' ? 'rgba(30, 64, 175, 0.2)' : 'rgba(63, 98, 18, 0.2)'}`
                    }}>
                      {person.type}
                    </span>
                  </td>

                  {/* Compensation */}
                  <td style={{ padding: '12px' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                        {person.type === 'Employee' ? 'Annual CTC' : 'Monthly Stipend'}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{person.type === 'Employee' ? (person.salaryDetails?.annualCTC?.toLocaleString() || 0) : (person.salaryDetails?.baseSalary?.toLocaleString() || 0)}
                      </div>
                    </div>
                  </td>

                  {/* OT Status */}
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      background: person.overtimeEligible ? 'rgba(63, 98, 18, 0.1)' : 'rgba(0,0,0,0.05)',
                      color: person.overtimeEligible ? '#3f6212' : 'var(--text-muted)',
                      border: `1px solid ${person.overtimeEligible ? 'rgba(63, 98, 18, 0.2)' : 'rgba(0,0,0,0.1)'}`
                    }}>
                      {person.overtimeEligible ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px', textAlign: 'right', borderTopRightRadius: 12, borderBottomRightRadius: 12, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        onClick={(e) => handleToggleAccess(e, person)}
                        title={person.isPortalEnabled ? "Revoke Access" : "Give Access"}
                        className="btn-action-glass"
                        style={{ width: 40, height: 40, border: '1px solid var(--border)' }}
                      >
                        {actionLoading === person._id ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                      </button>
                      <button 
                        onClick={(e) => handleToggleOvertime(e, person)}
                        title={person.overtimeEligible ? "Disable OT" : "Enable OT"}
                        className="btn-action-glass"
                        style={{ width: 40, height: 40, border: '1px solid var(--border)' }}
                      >
                        {actionLoading === person._id + '_ot' ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} color={person.overtimeEligible ? '#6fa945' : 'var(--text-muted)'} />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/generate?staffId=${person._id}`); }}
                        title="Generate Payslip"
                        className="btn-action-glass"
                        style={{ width: 40, height: 40, border: '1px solid var(--border)' }}
                      >
                        <FilePlus size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/staff/${person._id}`); }}
                        title="View Full Details"
                        style={{ 
                          padding: '10px 24px', 
                          background: 'var(--primary)', 
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14,
                          fontWeight: 700,
                          borderRadius: 12,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(88, 131, 59, 0.2)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
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
                    <InputField
                      label="Employee ID / Code"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder={formData.type === 'Intern' ? 'Eg:-BDA-INT-001' : 'Eg:-BDA-EMP-0001'}
                      readOnly
                      hint="Auto-generated when you save."
                    />
                    <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                    <InputField
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      hint="Enter 10-digit number"
                    />
                    <InputField label="Joining Date" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
                    <InputField label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
                    <InputField label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} required />
                    <InputField label="Department" name="department" value={formData.department} onChange={handleInputChange} required />
                    <InputField label="PF Number" name="pfNumber" value={formData.pfNumber} onChange={handleInputChange} placeholder="XX/XXX/0000000" />
                  </div>

                  <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16 }}>Financial Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <InputField
                      label="PAN Number"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handlePanChange}
                      required
                      pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      maxLength={10}
                      hint="Format: ABCDE1234F"
                    />
                    <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} required />
                    <InputField
                      label="Account Number"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleAccountNumberChange}
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
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
