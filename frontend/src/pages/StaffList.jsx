import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Briefcase, ChevronRight, X, Loader2, User, Mail, Phone, Key, Ban, Edit, Info, Clock, UserGroup } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import { useTheme } from '../context/ThemeContext'

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
  const { theme } = useTheme()

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
      setStaff(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (err) {
      toast.error('Failed to fetch staff data')
      setStaff([])
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
      fullName: person.fullName || '',
      employeeId: person.employeeId || '',
      email: person.email || '',
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
    const name = s.fullName || ''
    const email = s.email || ''
    const desig = s.designation || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          email.toLowerCase().includes(search.toLowerCase()) ||
                          desig.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'All' || s.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: 1400, margin: '0 auto' }}>
      <header className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}>
        <div>
          <h1 style={{ color: 'var(--primary)', marginBottom: 8 }}>Staff Management</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Comprehensive directory of employees and interns.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={18} strokeWidth={2.5} /> Add New Staff
        </button>
      </header>

      <div className="fade-in" style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', animationDelay: '100ms' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" placeholder="Search by name, email or designation..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field glass"
            style={{ width: '100%', paddingLeft: 44, height: 48, borderRadius: 12 }}
          />
        </div>
        <div className="glass" style={{ display: 'flex', background: 'var(--surface)', borderRadius: 12, padding: 4 }}>
          {['All', 'Employee', 'Intern'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 24px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: filterType === type ? 'var(--primary)' : 'transparent',
                color: filterType === type ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 300 }} />
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="glass fade-in" style={{ textAlign: 'center', padding: 80, borderRadius: 24, border: '2px dashed var(--border)' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)' }}>
            <Briefcase size={40} />
          </div>
          <h2 style={{ color: 'var(--primary)', marginBottom: 12 }}>No Records Found</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 32px', fontWeight: 500 }}>We couldn't find any staff members matching your current filters. Try a different search term or add a new member.</p>
          <button className="btn-secondary" onClick={() => { setSearch(''); setFilterType('All'); }}>Clear All Filters</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {filteredStaff.map((person, i) => (
            <motion.div
              key={person._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/staff/${person._id}`)}
              className="card glass btn-hover"
              style={{
                cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: 24, borderRadius: 20
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ 
                    width: 52, height: 52, borderRadius: 14, 
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--bda-green-light) 100%)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#ffffff', fontSize: 22, fontWeight: 900,
                    boxShadow: '0 4px 12px rgba(88, 131, 59, 0.2)'
                  }}>
                    {(person.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text)', fontWeight: 800 }}>{person.fullName || 'Unnamed'}</h3>
                    <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.05em' }}>{person.employeeId || 'NO-ID'}</div>
                  </div>
                </div>
                <button 
                   onClick={(e) => handleEdit(e, person)}
                   style={{ padding: 10, borderRadius: 12, border: 'none', background: 'var(--bg)', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                   className="btn-hover"
                >
                  <Edit size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
                  <Briefcase size={16} color="var(--primary)" /> {person.designation || 'No designation'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
                  <Mail size={16} color="var(--primary)" /> {person.email || 'No email'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
                  <UserGroup size={16} color="var(--primary)" /> {person.department || 'General Department'}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <span className={`badge ${person.type === 'Employee' ? 'badge-navy' : 'badge-emerald'}`} style={{ borderRadius: 8 }}>{person.type}</span>
                {person.isPortalEnabled ? (
                  <span className="badge badge-emerald" style={{ borderRadius: 8 }}>Portal Active</span>
                ) : (
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)', borderRadius: 8 }}>Portal Locked</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={(e) => handleToggleAccess(e, person)}
                    disabled={actionLoading === person._id}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: person.isPortalEnabled ? 'var(--bg)' : 'var(--primary)',
                      color: person.isPortalEnabled ? 'var(--primary)' : '#ffffff',
                      border: person.isPortalEnabled ? '1.5px solid var(--primary)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {actionLoading === person._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : person.isPortalEnabled ? (
                      <><Ban size={16} /> Revoke</>
                    ) : (
                      <><Key size={16} /> Grant Access</>
                    )}
                  </button>
                  <button 
                    onClick={(e) => handleToggleOvertime(e, person)}
                    disabled={actionLoading === person._id + '_ot'}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'var(--bg)',
                      color: 'var(--primary)',
                      border: '1.5px solid var(--primary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {actionLoading === person._id + '_ot' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>{person.overtimeEligible ? 'Disable OT' : 'Enable OT'}</>
                    )}
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <div>
                     <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                       {person.type === 'Employee' ? 'Annual CTC' : 'Monthly Stipend'}
                     </div>
                     <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>
                       ₹{person.type === 'Employee' ? (person.salaryDetails?.annualCTC?.toLocaleString() || 0) : (person.salaryDetails?.baseSalary?.toLocaleString() || 0)}
                     </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/staff/${person._id}`)}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: 12, borderRadius: 10 }}
                  >
                    View Full Profile
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(10, 15, 10, 0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass"
              style={{ background: 'var(--surface)', borderRadius: 24, width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)', border: '1px solid var(--border)' }}
            >
              <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(88, 131, 59, 0.03)' }}>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--primary)' }}>{editingStaff ? 'Update Staff Member' : 'Register New Staff'}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{editingStaff ? 'Modify existing professional and financial records.' : 'Create a new employee or intern profile in the system.'}</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingStaff(null); resetForm(); }} style={{ padding: 8, background: 'var(--bg)', border: 'none', borderRadius: 12, cursor: 'pointer', color: 'var(--primary)' }} className="btn-hover"><X size={24} /></button>
              </div>
              
              <div style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>
                <form id="addStaffForm" onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: 'var(--bg)', padding: 6, borderRadius: 16, border: '1px solid var(--border)' }}>
                    {['Employee', 'Intern'].map(type => (
                      <button 
                        key={type} type="button" onClick={() => setFormData({ ...formData, type })}
                        style={{ 
                          flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14,
                          background: formData.type === type ? 'var(--primary)' : 'transparent',
                          color: formData.type === type ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer'
                        }}
                      >{type}</button>
                    ))}
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><User size={18} /></div>
                      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)' }}>Professional Identity</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                      <InputField label="Full Legal Name" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="e.g. John Doe" />
                      <InputField label="Employee ID / Code" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required placeholder="e.g. BDA-2024-001" />
                      <InputField label="Official Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="john.doe@company.com" />
                      <InputField label="Contact Number" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="+91 XXXXX XXXXX" />
                      <InputField label="Date of Joining" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
                      <InputField label="Current Designation" name="designation" value={formData.designation} onChange={handleInputChange} required placeholder="e.g. Software Engineer" />
                      <InputField label="Primary Department" name="department" value={formData.department} onChange={handleInputChange} required placeholder="e.g. Engineering" />
                      <InputField label="PF Account Number" name="pfNumber" value={formData.pfNumber} onChange={handleInputChange} placeholder="XX/XXX/0000000" />
                    </div>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Briefcase size={18} /></div>
                      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)' }}>Financial & Tax Setup</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                      <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleInputChange} required placeholder="ABCDE1234F" />
                      <InputField label="Bank Institution" name="bankName" value={formData.bankName} onChange={handleInputChange} required placeholder="e.g. HDFC Bank" />
                      <InputField label="Salary Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required placeholder="XXXXXXXXXXXX" />
                      <InputField label="Bank IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required placeholder="HDFC0001234" />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><History size={18} /></div>
                      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)' }}>Compensation Structure</h3>
                    </div>
                    {formData.type === 'Employee' ? (
                      <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
                        <InputField label="Total Annual CTC (₹)" type="number" name="annualCTC" value={formData.annualCTC} onChange={handleInputChange} required />
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '12px 0 0', fontWeight: 500, lineHeight: 1.5 }}>
                          The statutory engine will automatically derive Basic Pay, HRA, and Employer PF contributions based on this CTC following the latest labor codes.
                        </p>
                      </div>
                    ) : (
                      <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
                        <InputField label="Monthly Stipend Amount (₹)" type="number" name="baseSalary" value={formData.baseSalary} onChange={handleInputChange} required />
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '12px 0 0', fontWeight: 500, lineHeight: 1.5 }}>
                          For Interns, this fixed monthly amount is used. Proration and LOP deductions will be applied based on attendance logs.
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div style={{ padding: '24px 40px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <button type="button" onClick={() => { setShowModal(false); setEditingStaff(null); resetForm(); }} className="btn-secondary" style={{ padding: '12px 32px' }}>Discard Changes</button>
                <button type="submit" form="addStaffForm" disabled={submitting} className="btn-primary" style={{ padding: '12px 32px' }}>
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : (editingStaff ? 'Update Profile' : 'Complete Registration')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
