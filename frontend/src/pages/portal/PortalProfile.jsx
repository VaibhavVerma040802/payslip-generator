import { useState } from 'react'
import { useStaffPortal } from '../../context/StaffPortalContext'
import { User, Phone, Mail, Briefcase, Building, Save, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'
import { motion } from 'framer-motion'

export default function PortalProfile() {
  const { staffUser, setStaffUser } = useStaffPortal()
  const [phone, setPhone] = useState(staffUser?.phone || '')
  const [saving, setSaving] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/portal/me', { phone })
      setStaffUser({ ...staffUser, phone })
      toast.success('Profile details updated.')
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 8 }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Manage your personal details and contact information.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass" style={{ padding: 40 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 40 }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 24, background: 'var(--navy)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'white', fontSize: 32, fontWeight: 800,
              boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)'
            }}>
              {staffUser?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--navy)', fontSize: 24 }}>{staffUser?.fullName}</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <span className="badge badge-navy">{staffUser?.designation}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="email" disabled value={staffUser?.email || ''}
                  style={{
                    width: '100%', padding: '16px 16px 16px 50px', background: 'var(--bg)',
                    border: '2px solid var(--border)', borderRadius: 16, outline: 'none', fontSize: 15,
                    color: 'var(--text-muted)', cursor: 'not-allowed', fontWeight: 600
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="tel" required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  style={{
                    width: '100%', padding: '16px 16px 16px 50px', background: 'var(--bg)',
                    border: '2px solid var(--border)', borderRadius: 16, outline: 'none', fontSize: 15,
                    color: 'var(--text)', transition: 'all 0.2s', fontWeight: 600
                  }}
                  className="btn-hover"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={saving}
              style={{
                width: '100%', height: 56, background: 'var(--navy)', color: 'white',
                border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)', transition: 'all 0.2s', marginTop: 16
              }}
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Save Changes
            </motion.button>
          </form>
        </motion.div>

        {/* Professional Context Card */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: 40 }}>
          <h3 style={{ color: 'var(--navy)', fontSize: 20, marginBottom: 32 }}>Full Profile Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.department || 'N/A'}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Joining Date</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.joiningDate ? new Date(staffUser.joiningDate).toLocaleDateString() : 'N/A'}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>PF Number</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.pfNumber || 'N/A'}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Employment Type</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.type || 'Employee'}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Bank Name</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.financials?.bankName || 'N/A'}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Account Number</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.financials?.accountNumber || 'N/A'}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>PAN Number</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.financials?.panNumber || 'N/A'}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>IFSC Code</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{staffUser?.financials?.ifscCode || 'N/A'}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Casual Leave Balance</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--emerald)' }}>{staffUser?.leaveBalance?.casual || 0} Days</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Sick Leave Balance</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--emerald)' }}>{staffUser?.leaveBalance?.sick || 0} Days</div>
            </div>
          </div>

          <div style={{ marginTop: 40, padding: 20, background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong>Policy Notice:</strong> Only the phone number can be self-updated. For changes to PAN, Bank details, or Leave balances, please submit a formal request via the Corporate Portal.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
