import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Building2, MapPin, Loader2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    companyName: '', 
    companyAddress: '' 
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      toast.success('Registration successful!')
      navigate('/profile') // Redirect to profile to complete setup
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '40px 20px'
    }}>
      <div className="fade-up" style={{
        width: '100%', maxWidth: 460, background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)', padding: '40px', boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, background: 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)', margin: '0 auto 16px',
          }}>
            <Building2 size={24} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
            Register Company
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Start generating professional payslips today.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Company Name</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text" required
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })}
                placeholder="Acme Tech Pvt Ltd"
                style={{
                  width: '100%', padding: '12px 12px 12px 40px', background: 'var(--surface-2)',
                  border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontSize: 14
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Work Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="hr@acme.com"
                style={{
                  width: '100%', padding: '12px 12px 12px 40px', background: 'var(--surface-2)',
                  border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontSize: 14
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Company Address</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text" required
                value={form.companyAddress}
                onChange={e => setForm({ ...form, companyAddress: e.target.value })}
                placeholder="Block 4, IT Park, Hyderabad"
                style={{
                  width: '100%', padding: '12px 12px 12px 40px', background: 'var(--surface-2)',
                  border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontSize: 14
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Password (min 6 chars)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="password" required minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 12px 12px 40px', background: 'var(--surface-2)',
                  border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none', fontSize: 14
                }}
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px', background: 'var(--navy)', color: 'white',
              border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
              boxShadow: 'var(--shadow)',
            }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <>Create Account <UserPlus size={16} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--text-muted)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
