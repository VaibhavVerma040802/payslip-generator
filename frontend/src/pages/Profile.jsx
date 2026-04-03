import { useState, useEffect } from 'react'
import { Building2, MapPin, Mail, Phone, Hash, Upload, Loader2, Save, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyCIN: '',
    companyLogo: ''
  })

  useEffect(() => {
    if (user) {
      setForm({
        companyName: user.companyName || '',
        companyAddress: user.companyAddress || '',
        companyEmail: user.companyEmail || '',
        companyPhone: user.companyPhone || '',
        companyCIN: user.companyCIN || '',
        companyLogo: user.companyLogo || ''
      })
    }
  }, [user])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('Logo must be smaller than 2MB')
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm({ ...form, companyLogo: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', form)
      updateProfile(res.data.user)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 800, padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Company Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>Setup your company details for professional payslips.</p>
        </div>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          background: 'var(--bg-2)', color: 'var(--red)', border: '1px solid var(--red-2)',
          borderRadius: 10, fontWeight: 600, cursor: 'pointer'
        }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 32,
        boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Logo Section */}
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <div style={{
              width: 120, height: 120, borderRadius: 20, background: 'var(--surface-2)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed var(--border)', overflow: 'hidden', position: 'relative'
            }}>
              {form.companyLogo ? (
                <img src={form.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Building2 size={40} style={{ color: 'var(--text-light)' }} />
              )}
              <input 
                type="file" accept="image/*" onChange={handleLogoChange}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
              />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Click to upload your company logo (PNG/JPG, max 2MB)
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Company Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" required value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }} 
                />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" required value={form.companyAddress}
                  onChange={e => setForm({ ...form, companyAddress: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="email" value={form.companyEmail}
                  onChange={e => setForm({ ...form, companyEmail: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" value={form.companyPhone}
                  onChange={e => setForm({ ...form, companyPhone: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }} 
                />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Company CIN (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Hash size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" value={form.companyCIN}
                  onChange={e => setForm({ ...form, companyCIN: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }} 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: 40, width: '100%', padding: '16px', background: 'var(--navy)', color: 'white',
            borderRadius: 12, fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 16
          }}>
            {loading ? <Loader2 size={20} className="spin" /> : <><Save size={20} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  )
}
