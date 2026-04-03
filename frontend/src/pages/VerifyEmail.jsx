import { Mail, ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function VerifyEmail() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div className="fade-up" style={{
        width: '100%', maxWidth: 500, background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)', padding: '50px 40px', textAlign: 'center',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)'
      }}>
        <div style={{
          width: 70, height: 70, borderRadius: 20, background: '#dbeafe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0284c7', margin: '0 auto 24px',
        }}>
          <Mail size={32} />
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
          Check your email
        </h1>
        
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 30 }}>
          We've sent a verification link to your email address. 
          Please click the link to verify your account and start using PaySlip Pro.
        </p>

        <div style={{ background: 'var(--surface-2)', padding: 20, borderRadius: 12, marginBottom: 30 }}>
          <p style={{ fontSize: 13, color: 'var(--text-light)', margin: 0 }}>
            Didn't receive the email? Check your spam folder or <button style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 700, padding: 0, cursor: 'pointer' }}>resend email</button>.
          </p>
        </div>

        <Link to="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'var(--navy)', fontWeight: 700, textDecoration: 'none', fontSize: 15
        }}>
          Back to Sign In <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
