import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#f4f6fa', overflow: 'hidden'
    }}>
      {/* LEFT: Branding/Hero Sidebar */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        style={{
          flex: 1, background: '#1e3a5f', padding: '60px',
          display: 'flex', flexDirection: 'column', position: 'relative',
          color: 'white', borderRight: '6px solid #c9a84c',
          boxShadow: '10px 0 30px rgba(0,0,0,0.15)'
        }}
        className="login-sidebar"
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              PaySlip<span style={{ color: '#c9a84c' }}>Pro</span>
            </h1>
            <p style={{ fontSize: 18, color: '#aac4e0', lineHeight: 1.6, marginBottom: 40 }}>
              The definitive statutory payroll engine for the modern enterprise. Fully compliant with 2026 Indian Labour Codes.
            </p>
            
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#c9a84c', fontWeight: 800, fontSize: 24, marginBottom: 4 }}>100%</div>
                <div style={{ color: '#aac4e0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Compliant</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: 24, marginBottom: 4 }}>Fast</div>
                <div style={{ color: '#aac4e0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Processing</div>
              </div>
            </div>
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 40, left: 60, right: 60, fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          &copy; {new Date().getFullYear()} PaySlip Pro. All rights reserved.
        </div>
      </motion.div>

      {/* RIGHT: Login Form Screen */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            width: '100%', maxWidth: 440, background: 'white',
            borderRadius: 24, padding: 48, boxShadow: '0 25px 50px -12px rgba(30,58,95,0.1)',
            border: '1px solid rgba(30,58,95,0.05)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ 
              width: 64, height: 64, background: '#f8f9fa', borderRadius: 20, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 20px', color: '#1e3a5f', border: '1px solid #e2e8f0'
            }}>
              <Lock size={28} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#1e3a5f', marginBottom: 8 }}>
              Corporate Login
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Securely access your company payroll dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e3a5f', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="hr@company.com"
                  style={{
                    width: '100%', padding: '14px 16px 14px 44px', background: '#f8fafc',
                    border: '2px solid #e2e8f0', borderRadius: 12, outline: 'none', fontSize: 15,
                    color: '#0f172a', transition: 'border-color 0.2s', fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
                <Link to="/forgot" style={{ fontSize: 12, color: '#c9a84c', fontWeight: 700, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password" required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '14px 16px 14px 44px', background: '#f8fafc',
                    border: '2px solid #e2e8f0', borderRadius: 12, outline: 'none', fontSize: 15,
                    color: '#0f172a', transition: 'border-color 0.2s', fontFamily: 'inherit'
                  }}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '16px', background: '#1e3a5f', color: 'white',
                border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 10px 20px -10px rgba(30,58,95,0.5)'
              }}
            >
              {loading ? <Loader2 size={20} className="spin" /> : <>Access Dashboard <ArrowRight size={18} /></>}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: '#64748b' }}>
            New to PaySlip Pro? <Link to="/register" style={{ color: '#1e3a5f', fontWeight: 800, textDecoration: 'underline', textDecorationColor: '#c9a84c' }}>Register Company</Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .login-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
