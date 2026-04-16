import { useState, useEffect } from 'react'
import { Building2, MapPin, Mail, Phone, Hash, Upload, Loader2, Save, LogOut, Image as ImageIcon, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import { useAuth } from '../context/AuthContext'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = (e) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  return matches
}

export default function Profile() {
  const { user, logout, updateProfile } = useAuth()
  const isMobile = useMediaQuery('(max-width: 1024px)')
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
        return toast.error('File size must be under 2MB')
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
      toast.success('Professional identity updated')
    } catch (err) {
      toast.error('Failed to update workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 60px)', maxWidth: 840, margin: '0 auto' }}>
      {/* Header Tier */}
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'var(--navy)', letterSpacing: '-0.02em', marginBottom: 4, fontSize: 'clamp(24px, 5vw, 32px)' }}>Workspace Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 14 }}>Configure your corporate identity and statutory branding.</p>
        </div>
        <div className="badge badge-gold" style={{ padding: '8px 16px', fontSize: 13 }}>Enterprise</div>
      </div>

      <div className="fade-in glass" style={{ padding: 'clamp(20px, 5vw, 48px)', animationDelay: '100ms' }}>
        <form onSubmit={handleSubmit}>
          {/* Brand Identity / Logo */}
          <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Identity Branding</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 'clamp(100px, 20vw, 140px)', height: 'clamp(100px, 20vw, 140px)', borderRadius: 24, background: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--border)', overflow: 'hidden',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', transition: 'all 0.3s'
              }}>
                {form.companyLogo ? (
                  <img src={form.companyLogo} alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <ImageIcon size={32} color="var(--text-light)" strokeWidth={1.5} />
                    <div style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 700, marginTop: 4 }}>No Logo</div>
                  </div>
                )}
              </div>
              <label style={{
                position: 'absolute', bottom: -10, right: -10, 
                width: 40, height: 40, borderRadius: 12, background: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer', border: '3px solid var(--surface)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s'
              }} className="btn-hover">
                <Camera size={16} />
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 24, fontWeight: 600, textAlign: 'center' }}>Used on all official statutory documents.</p>
          </div>

          {/* Form Fields Grid */}
          <div className="grid-2">
            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Entity Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" required value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--bg)', fontSize: 15, fontWeight: 600, outline: 'none', color: 'var(--text)' }} 
                  className="btn-hover"
                />
              </div>
            </div>

            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Statutory Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" required value={form.companyAddress}
                  onChange={e => setForm({ ...form, companyAddress: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--bg)', fontSize: 15, fontWeight: 600, outline: 'none', color: 'var(--text)' }} 
                  className="btn-hover"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Official Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="email" value={form.companyEmail}
                  onChange={e => setForm({ ...form, companyEmail: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--bg)', fontSize: 15, fontWeight: 600, outline: 'none', color: 'var(--text)' }} 
                  className="btn-hover"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Contact Line</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" value={form.companyPhone}
                  onChange={e => setForm({ ...form, companyPhone: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--bg)', fontSize: 15, fontWeight: 600, outline: 'none', color: 'var(--text)' }} 
                  className="btn-hover"
                />
              </div>
            </div>

            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Corporate CIN</label>
              <div style={{ position: 'relative' }}>
                <Hash size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" value={form.companyCIN}
                  onChange={e => setForm({ ...form, companyCIN: e.target.value })}
                  style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--bg)', fontSize: 15, fontWeight: 600, outline: 'none', color: 'var(--text)' }} 
                  className="btn-hover"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              marginTop: 40, width: '100%', height: 52, background: 'var(--navy)', color: 'white',
              borderRadius: 14, fontWeight: 800, cursor: 'pointer', border: 'none', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 15,
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)', transition: 'all 0.3s'
            }}
            className="btn-hover"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18} /> Update Settings</>}
          </button>
        </form>
      </div>
    </div>
    </div>
  )
}
