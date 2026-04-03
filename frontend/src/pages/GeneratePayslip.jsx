import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { 
  Building2, User, Calendar, TrendingUp, Minus, 
  ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  FileText, IndianRupee, Landmark, Wallet, Plus, Download, Send
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import api from '../api'
import AnimatedNumber from '../components/AnimatedNumber'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

const INITIAL = {
  companyName: '', companyAddress: '', companyEmail: '', companyPhone: '', companyCIN: '', companyLogo: '',
  employeeName: '', employeeId: '', designation: '', department: '', employeeEmail: '',
  dateOfJoining: '', bankAccount: '', bankName: '', panNumber: '', pfNumber: '',
  month: MONTHS[new Date().getMonth()], year: CURRENT_YEAR,
  payDate: new Date().toISOString().split('T')[0],
  workingDays: 26, paidDays: 26,
  employmentType: 'regular', annualCTC: '', stipend: '', employerPF: '',
  basicSalary: '0', hra: '0', specialAllowance: '0', otherEarnings: '0',
  providentFund: '0', esi: '0', professionalTax: '0', tds: '0',
  loanDeduction: '0', otherDeductions: '0', notes: '',
}

// ─────────────────────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────────────────────

function StepLabel({ num, label, active, completed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: active || completed ? 1 : 0.4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: completed ? 'var(--emerald)' : active ? 'var(--navy)' : 'var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 13, fontWeight: 700, transition: 'all 0.3s'
      }}>
        {completed ? <CheckCircle2 size={16} /> : num}
      </div>
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: 'var(--navy)' }}>{label}</span>
    </div>
  )
}

function InputField({ label, name, value, onChange, type = 'text', placeholder, icon: Icon, required }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          style={{
            width: '100%', padding: Icon ? '10px 12px 10px 36px' : '10px 12px',
            border: '1.5px solid var(--border)', borderRadius: 10,
            fontSize: 14, color: 'var(--text)', outline: 'none',
            background: 'var(--surface)', transition: 'all 0.2s'
          }}
          className="btn-hover"
          onFocus={e => e.target.style.borderColor = 'var(--navy)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>
    </div>
  )
}

function PreviewRow({ label, value, type = 'normal', isDeduction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ 
        fontSize: 13, 
        fontWeight: type === 'bold' ? 700 : 600,
        color: isDeduction ? '#ef4444' : type === 'bold' ? 'var(--navy)' : 'var(--text)'
      }}>
        <AnimatedNumber value={parseFloat(value || 0)} decimals={type === 'bold' ? 0 : 0} />
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function GeneratePayslip() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [step, setStep] = useState(user?.companyName ? 1 : 0)
  const [form, setForm] = useState(() => {
    if (location.state?.duplicateData) return { ...INITIAL, ...location.state.duplicateData }
    if (user) return { ...INITIAL, ...user }
    return INITIAL
  })
  const [submitting, setSubmitting] = useState(false)

  // STATUTORY ENGINE (2026 Standards)
  const totals = useMemo(() => {
    const ctc = parseFloat(form.annualCTC) || 0;
    const monthlyCTC = Math.round(ctc / 12);
    
    if (form.employmentType === 'intern') {
      return {
        basic: 0, hra: 0, special: 0, gross: monthlyCTC,
        pf: 0, esi: 0, pt: 0, deductions: 0, net: monthlyCTC
      }
    }

    const basic = Math.round(monthlyCTC * 0.5);
    const hra = Math.round(basic * 0.5); // 50% Metro Rule (latest request)
    const empPF = Math.min(Math.round(basic * 0.12), 1800);
    const special = monthlyCTC - (basic + hra + empPF);
    const gross = basic + hra + special;
    const esi = gross <= 21000 ? Math.ceil(gross * 0.0075) : 0;
    const pt = 200;
    const deductions = empPF + esi + pt + (parseFloat(form.tds) || 0) + (parseFloat(form.loanDeduction) || 0);

    return {
      basic, hra, special, gross,
      pf: empPF, esi, pt, deductions, net: gross - deductions
    }
  }, [form.annualCTC, form.employmentType, form.tds, form.loanDeduction]);

  // Sync derived values to form for persistence
  useEffect(() => {
    setForm(f => ({
      ...f,
      basicSalary: totals.basic.toString(),
      hra: totals.hra.toString(),
      specialAllowance: totals.special.toString(),
      providentFund: totals.pf.toString(),
      esi: totals.esi.toString(),
      professionalTax: totals.pt.toString(),
      stipend: form.employmentType === 'intern' ? totals.gross.toString() : '0'
    }));
  }, [totals]);

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = { ...form, ...totals, grossEarnings: totals.gross, totalDeductions: totals.deductions, netSalary: totals.net };
      const res = await api.post('/payslips', payload)
      toast.success('Payslip generated!')
      navigate(`/payslips/${res.data.data._id}`)
    } catch (err) {
      toast.error('Failed to generate payslip')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="split-screen"
    >
      {/* LEFT: FORM SECTION */}
      <div style={{ padding: '40px', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <header style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, color: 'var(--navy)', marginBottom: 8 }}>Payroll Engine</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Indian Statutory Standards 2026 (Metro v1.2)</p>
          </header>

          <div style={{ display: 'flex', gap: 24, marginBottom: 44, paddingBottom: 12, borderBottom: '1.5px solid var(--border)' }}>
            <StepLabel num={1} label="Identity" active={step === 1} completed={step > 1} />
            <StepLabel num={2} label="Period" active={step === 2} completed={step > 2} />
            <StepLabel num={3} label="Salary" active={step === 3} completed={step > 3} />
          </div>

          <form onSubmit={e => { e.preventDefault(); step < 3 ? setStep(s => s + 1) : handleSubmit() }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <InputField label="Employee Name" required value={form.employeeName} onChange={e => setForm({...form, employeeName: e.target.value})} placeholder="e.g. Aryan Sharma" icon={User} />
                  <InputField label="Employee ID" required value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} placeholder="e.g. PS-001" icon={FileText} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <InputField label="Designation" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Software Dev" />
                    <InputField label="Department" required value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Engineering" />
                  </div>
                  <InputField label="Employee Email" required type="email" value={form.employeeEmail} onChange={e => setForm({...form, employeeEmail: e.target.value})} placeholder="aryan@acme.com" icon={Send} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Month</label>
                      <select 
                        value={form.month} 
                        onChange={e => setForm({...form, month: e.target.value})}
                        style={{ width: '100%', padding: '10px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none' }}
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Year</label>
                      <select 
                        value={form.year} 
                        onChange={e => setForm({...form, year: e.target.value})}
                        style={{ width: '100%', padding: '10px', border: '1.5px solid var(--border)', borderRadius: 10, outline: 'none' }}
                      >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <InputField label="Pay Date" type="date" value={form.payDate} onChange={e => setForm({...form, payDate: e.target.value})} icon={Calendar} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <InputField label="Working Days" type="number" value={form.workingDays} onChange={e => setForm({...form, workingDays: e.target.value})} />
                    <InputField label="Paid Days" type="number" value={form.paidDays} onChange={e => setForm({...form, paidDays: e.target.value})} />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
                    <button 
                      type="button"
                      onClick={() => setForm({...form, employmentType: 'regular'})}
                      style={{ 
                        flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
                        background: form.employmentType === 'regular' ? 'white' : 'transparent',
                        color: form.employmentType === 'regular' ? 'var(--navy)' : 'var(--text-muted)',
                        boxShadow: form.employmentType === 'regular' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >Regular Employee</button>
                    <button 
                      type="button"
                      onClick={() => setForm({...form, employmentType: 'intern'})}
                      style={{ 
                        flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
                        background: form.employmentType === 'intern' ? 'white' : 'transparent',
                        color: form.employmentType === 'intern' ? 'var(--navy)' : 'var(--text-muted)',
                        boxShadow: form.employmentType === 'intern' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >Intern</button>
                  </div>

                  <InputField label="Annual CTC" required type="number" value={form.annualCTC} onChange={e => setForm({...form, annualCTC: e.target.value})} placeholder="e.g. 600000" icon={IndianRupee} />
                  
                  {form.employmentType === 'regular' && (
                    <LayoutGroup>
                      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 18, background: 'var(--bg)', borderRadius: 16, border: '1.5px solid var(--border)', marginBottom: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <InputField label="TDS (Monthly)" type="number" value={form.tds} onChange={e => setForm({...form, tds: e.target.value})} placeholder="0" />
                          <InputField label="Loan Deduct" type="number" value={form.loanDeduction} onChange={e => setForm({...form, loanDeduction: e.target.value})} placeholder="0" />
                        </div>
                      </motion.div>
                    </LayoutGroup>
                  )}
                  <InputField label="Bank Details (Optional)" value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} placeholder="Acc No or IFSC" icon={Landmark} />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={() => setStep(s => s - 1)}
                  style={{ width: 100, height: 48, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', fontWeight: 600 }}
                >Back</button>
              )}
              <button 
                type="submit" 
                disabled={submitting}
                className="btn-hover"
                style={{ 
                  flex: 1, height: 48, borderRadius: 12, border: 'none', 
                  background: submitting ? 'var(--text-light)' : 'var(--navy)', 
                  color: 'white', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : step === 3 ? 'Generate Now' : 'Continue'}
                {step < 3 && <ChevronRight size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT: LIVE PREVIEW (Digital Document) */}
      <div style={{ background: '#f1f5f9', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          layout
          className="glass"
          style={{ 
            width: '100%', maxWidth: 460, borderRadius: 28, 
            boxShadow: '0 40px 60px -20px rgba(15,23,42,0.2)', padding: '32px' 
          }}
        >
          {/* Document Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, borderBottom: '2px solid rgba(15,23,42,0.1)', paddingBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', marginBottom: 2 }}>{form.companyName || 'Acme Corp'}</div>
              <div className="badge badge-gold" style={{ fontSize: 9 }}>Indian Standard Slip</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pay Period</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{form.month} {form.year}</div>
            </div>
          </div>

          {/* Employee Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 12, background: 'rgba(15,23,42,0.03)', borderRadius: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
              {(form.employeeName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{form.employeeName || 'Anonymous User'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{form.designation || 'Position TBD'} · {form.department}</div>
            </div>
          </div>

          {/* Table Breakdown */}
          <div style={{ marginBottom: 28 }}>
            <PreviewRow label="Identity Code" value={form.employeeId || '—'} type="text" />
            <PreviewRow label="Basic Salary (50%)" value={totals.basic} />
            <PreviewRow label="HRA (50%)" value={totals.hra} />
            <AnimatePresence>
              {form.employmentType === 'regular' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <PreviewRow label="Special Allowance" value={totals.special} />
                  <PreviewRow label="Statutory PF" value={totals.pf} isDeduction />
                  <PreviewRow label="ESI Contribution" value={totals.esi} isDeduction />
                  <PreviewRow label="Professional Tax" value={totals.pt} isDeduction />
                </motion.div>
              )}
            </AnimatePresence>
            <PreviewRow label="Gross Earnings" value={totals.gross} type="bold" />
            <PreviewRow label="Total Deductions" value={totals.deductions} isDeduction type="bold" />
          </div>

          {/* Result Banner */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            style={{ 
              background: 'var(--navy)', color: 'white', padding: '20px', 
              borderRadius: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' 
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Net Pay (Monthly Take-Home)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--emerald)' }}>
              <AnimatedNumber value={totals.net} decimals={0} />
            </div>
            <div style={{ 
              position: 'absolute', right: -10, bottom: -10, opacity: 0.1,
              transform: 'rotate(-15deg)'
            }}>
              <IndianRupee size={80} />
            </div>
          </motion.div>

          <p style={{ marginTop: 24, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
            This payslip is a real-time reactive preview and is legally compliant with 2026 Indian statutory rules.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
