import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStaffPortal } from '../../context/StaffPortalContext'
import { Mail, Lock, Loader2, ArrowRight, Clock, ShieldCheck, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function PortalLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useStaffPortal()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password)
      toast.success('Staff session initiated.')
      if (data.mustChangePassword) {
        navigate('/portal/change-password')
      } else {
        navigate('/portal/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials or portal disabled')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg)', overflow: 'hidden'
    }}>
      {/* LEFT: Branding/Hero Sidebar */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        style={{
          flex: '0 0 45%', background: 'var(--navy-dark)', padding: '60px',
          display: 'flex', flexDirection: 'column', position: 'relative',
          color: 'white', borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '20px 0 50px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}
        className="login-sidebar"
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 460 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 60 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            }}>
              <Clock size={24} color="white" strokeWidth={2.5} />
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24, fontWeight: 800,
              color: 'white', letterSpacing: '-0.02em',
            }}>Staff<span style={{ color: 'var(--emerald)' }}>Portal</span></div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: 20, lineHeight: 1, letterSpacing: '-0.04em' }}>
              Your Work, <span style={{ color: 'var(--emerald)' }}>Simplified.</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 48, fontWeight: 500 }}>
              Access your attendance logs, profile, and payroll summaries with enterprise-grade security.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                <ShieldCheck size={28} color="var(--emerald)" style={{ marginBottom: 12 }} />
                <div style={{ color: 'white', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Auth</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Zap size={28} color="var(--emerald)" style={{ marginBottom: 12 }} />
                <div style={{ color: 'white', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Real-time Logs</div>
              </div>
            </div>
          </motion.div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
          Staff Experience Interface &copy; {new Date().getFullYear()} PaySlip Pro
        </div>
      </motion.div>

      {/* RIGHT: Login Form Screen */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px, 5vw, 60px)', position: 'relative' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            width: '100%', maxWidth: 440,
            borderRadius: 32, padding: 'clamp(32px, 5vw, 60px)',
          }}
          className="glass"
        >
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 12 }}>Staff Login</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 500 }}>
              Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  style={{
                    width: '100%', padding: '16px 16px 16px 50px', background: 'var(--bg)',
                    border: '2px solid var(--border)', borderRadius: 16, outline: 'none', fontSize: 15,
                    color: 'var(--text)', transition: 'all 0.2s', fontWeight: 600
                  }}
                  className="btn-hover"
                />
              </div>
            </div>

            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <Link to="/portal/forgot-password" style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 700, textDecoration: 'none' }}>Forgot Access?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="password" required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              style={{
                width: '100%', height: 60, background: 'var(--navy)', color: 'white',
                border: 'none', borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 15px 30px -10px rgba(15,23,42,0.4)', transition: 'all 0.3s'
              }}
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <>Access Portal <ArrowRight size={20} /></>}
            </motion.button>
          </form>
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
