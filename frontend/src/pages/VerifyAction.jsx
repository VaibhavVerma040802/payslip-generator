import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import api from '../api'

export default function VerifyAction() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the link.')
      return
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`)
        setStatus('success')
        setMessage(res.data?.message || 'Email Verified Successfully!')
        
        // Auto-redirect to login
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'The verification link is invalid or has expired.')
      }
    }

    verifyToken()
  }, [searchParams, navigate])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div className="fade-up" style={{
        width: '100%', maxWidth: 440, background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)', padding: '50px 40px', textAlign: 'center',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)'
      }}>
        {status === 'loading' && (
          <>
            <div style={{ margin: '0 auto 24px', color: 'var(--navy)', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={48} className="spin" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
              Verifying your email...
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 70, height: 70, borderRadius: 20, background: 'var(--emerald-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--emerald)', margin: '0 auto 24px',
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--emerald)', marginBottom: 12 }}>
              Account Verified!
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
              {message} You will be redirected to the login page momentarily.
            </p>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy)',
              color: 'white', padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none'
            }}>
              Go to Login <ArrowRight size={16} />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 70, height: 70, borderRadius: 20, background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', margin: '0 auto 24px',
            }}>
              <XCircle size={36} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginBottom: 12 }}>
              Verification Failed
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
              {message}
            </p>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, border: '2px solid var(--navy)',
              color: 'var(--navy)', padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none'
            }}>
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
