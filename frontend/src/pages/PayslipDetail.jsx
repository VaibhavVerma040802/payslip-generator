import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Download, Mail, Printer, Loader2,
  Building2, User, Calendar, Banknote, CheckCircle2,
} from 'lucide-react'
import api from '../api'

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

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', flex: '0 0 160px' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px', background: accent ? 'var(--navy)' : 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: accent ? 'rgba(201,168,76,0.2)' : 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={accent ? 'var(--gold)' : 'white'} />
        </div>
        <span style={{
          fontWeight: 700, fontSize: 13.5,
          color: accent ? 'white' : 'var(--navy)',
        }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function SalaryRow({ label, amount, type = 'earning', bold }) {
  const color = type === 'earning' ? 'var(--green)' : type === 'deduction' ? 'var(--red)' : 'var(--navy)'
  if (!amount || parseFloat(amount) === 0) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', borderRadius: 7, marginBottom: 3,
      background: bold ? (type === 'net' ? 'var(--navy)' : 'var(--surface-2)') : 'transparent',
    }}>
      <span style={{
        fontSize: bold ? 13.5 : 13,
        fontWeight: bold ? 700 : 400,
        color: bold && type === 'net' ? 'var(--gold)' : 'var(--text)',
      }}>
        {label}
      </span>
      <span style={{
        fontWeight: bold ? 700 : 500,
        fontSize: bold ? 15 : 13,
        color: bold && type === 'net' ? 'white' : color,
      }}>
        ₹{parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </span>
    </div>
  )
}

function EmailModal({ payslip, onClose, onSent }) {
  const [email, setEmail] = useState(payslip.employeeEmail)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!email) { toast.error('Enter an email address'); return }
    setLoading(true)
    try {
      await api.post(`/payslips/${payslip._id}/email`, { email })
      toast.success(`Payslip sent to ${email}`)
      onSent()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(2px)',
    }}>
      <div className="fade-up" style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        padding: '32px', width: 440, boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={20} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Send Payslip via Email</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF will be attached automatically</div>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            Recipient Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid var(--border)', borderRadius: 8,
              fontSize: 14, color: 'var(--text)', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--navy)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
            Edit to send to a different address
          </div>
        </div>

        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          <strong>Subject:</strong> Salary Slip for {payslip.month} {payslip.year} — {payslip.companyName}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', border: '1.5px solid var(--border)',
              borderRadius: 8, background: 'none', fontWeight: 500, cursor: 'pointer', fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              flex: 2, padding: '10px', border: 'none',
              borderRadius: 8, background: loading ? 'var(--text-light)' : '#0284c7',
              color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <><Mail size={15} /> Send Email</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PayslipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const [payslip, setPayslip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const fetchPayslip = async () => {
    try {
      const res = await api.get(`/payslips/${id}`)
      setPayslip(res.data.data)
    } catch (err) {
      toast.error('Failed to load payslip')
      navigate('/payslips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayslip() }, [id])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await api.get(`/payslips/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `Payslip_${payslip.employeeName.replace(/\s+/g,'_')}_${payslip.month}_${payslip.year}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  if (loading) {
    return (
      <div style={{ padding: '36px 40px' }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ flex: 1, height: 400, borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!payslip) return null

  const p = payslip

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 40px)', maxWidth: 1100, margin: '0 auto' }}>
      {showEmailModal && (
        <EmailModal payslip={p} onClose={() => setShowEmailModal(false)} onSent={fetchPayslip} />
      )}

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/payslips')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: 13, marginBottom: 16, padding: 0
          }}
        >
          <ArrowLeft size={14} /> Back to Vault
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', minWidth: 280 }}>
            {p.companyLogo && (
              <img 
                src={p.companyLogo} 
                alt="Logo" 
                style={{ height: 'clamp(48px, 8vw, 60px)', width: 'auto', borderRadius: 12, objectFit: 'contain', background: 'white', padding: 4, border: '1px solid var(--border)' }} 
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2, margin: 0 }}>
                  {p.employeeName}
                </h1>
                {p.emailSent && <span className="badge badge-green"><CheckCircle2 size={10} /> Sent</span>}
              </div>
              <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13, fontWeight: 500 }}>
                {p.employmentType === 'intern' ? 'Internship' : 'Regular'} · {p.designation}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, width: isMobile ? '100% ' : 'auto' }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                flex: isMobile ? 1 : 'none',
                display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center',
                background: 'var(--emerald)', color: 'white',
                border: 'none', borderRadius: 12, padding: '12px 18px',
                fontWeight: 700, fontSize: 13, cursor: downloading ? 'wait' : 'pointer',
              }}
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>PDF</span>
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              style={{
                flex: isMobile ? 1 : 'none',
                display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center',
                background: '#0284c7', color: 'white',
                border: 'none', borderRadius: 12, padding: '12px 18px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              <Mail size={14} />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--navy)' }}>
          {p.month} {p.year}
        </span>
        {p.annualCTC > 0 && (
          <span className="badge" style={{ background: 'var(--gold-pale)', color: 'var(--navy-dark)', border: '1px solid var(--gold)' }}>
            CTC: ₹{p.annualCTC.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid-2" style={{ gap: 'clamp(16px, 3vw, 24px)' }}>
        <SectionCard title="Employer Info" icon={Building2}>
          <InfoRow label="Name" value={p.companyName} />
          <InfoRow label="Email" value={p.companyEmail} />
          <InfoRow label="CIN" value={p.companyCIN} />
        </SectionCard>

        <SectionCard title="Employee Info" icon={User}>
          <InfoRow label="Name" value={p.employeeName} />
          <InfoRow label="ID Code" value={p.employeeId} />
          <InfoRow label="Joining Date" value={p.dateOfJoining} />
          <InfoRow label="PAN" value={p.panNumber} />
        </SectionCard>

        <SectionCard title="Attendance" icon={Calendar}>
          <InfoRow label="Pay Period" value={`${p.month} ${p.year}`} />
          <InfoRow label="Worked Days" value={p.paidDays} />
          <InfoRow label="LOP Days" value={p.workingDays - p.paidDays} />
        </SectionCard>

        <SectionCard title="Payroll Table" icon={Banknote} accent>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>Earnings</div>
            {p.employmentType === 'intern' ? (
              <SalaryRow label="Gross Stipend" amount={p.stipend || p.grossEarnings} type="earning" bold />
            ) : (
              <>
                <SalaryRow label="Basic" amount={p.basicSalary} type="earning" />
                <SalaryRow label="HRA" amount={p.hra} type="earning" />
                <SalaryRow label="Gross Total" amount={p.grossEarnings} type="earning" bold />
              </>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>Deductions</div>
            <SalaryRow label="Taxes / TDS" amount={p.tds} type="deduction" />
            <SalaryRow label="Professional Tax" amount={p.professionalTax} type="deduction" />
            <SalaryRow label="Total Deductions" amount={p.totalDeductions} type="deduction" bold />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10 }}>
            <SalaryRow label="NET PAYABLE" amount={p.netSalary} type="net" bold />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-light)', textAlign: isMobile ? 'center' : 'right', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        Reference ID: {p._id} · Generated: {new Date(p.createdAt).toLocaleDateString()}
      </div>
    </div>

      {/* Email status */}
      {p.emailSent && (
        <div className="fade-up" style={{
          marginTop: 20, background: 'var(--green-light)', borderRadius: 10,
          padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid #a7f3d0',
        }}>
          <CheckCircle2 size={16} color="var(--green)" />
          <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
            Payslip was emailed to <strong>{p.employeeEmail}</strong>
            {p.emailSentAt && ` on ${new Date(p.emailSentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </span>
        </div>
      )}

      {/* Generated at */}
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-light)', textAlign: 'right' }}>
        Generated: {new Date(p.createdAt).toLocaleString('en-IN')} · ID: {p._id}
      </div>
    </div>
  )
}
