import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { 
  Building2, User, Calendar, TrendingUp, Minus, 
  ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  FileText, IndianRupee, Landmark, Wallet, Plus, Download, Send, Search
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
  employmentType: 'regular', annualCTC: '', baseSalary: '', stipend: '', employerPF: '',
  basicSalary: '0', hra: '0', specialAllowance: '0', otherEarnings: '0',
  providentFund: '0', esi: '0', professionalTax: '0', tds: '0',
  loanDeduction: '0', otherDeductions: '0', notes: '',
}

function StepLabel({ num, label, active, completed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: active || completed ? 1 : 0.4 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: completed ? 'var(--emerald)' : active ? 'var(--navy)' : 'var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 14, fontWeight: 800, transition: 'all 0.3s'
      }}>
        {completed ? <CheckCircle2 size={18} /> : num}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--navy)' : 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

function InputField({ label, name, value, onChange, type = 'text', placeholder, icon: Icon, required, min, max }) {
  const handleKeyDown = (e) => {
    if (type === 'number' && (e.key === '-' || e.key === 'e' || e.key === '+')) {
      e.preventDefault();
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          style={{
            width: '100%', padding: Icon ? '12px 14px 12px 42px' : '12px 14px',
            border: '2px solid var(--border)', borderRadius: 12,
            fontSize: 14, color: 'var(--text)', outline: 'none',
            background: 'var(--surface)', transition: 'all 0.2s',
            fontWeight: 500
          }}
          className="btn-hover"
          onFocus={e => e.target.style.borderColor = 'var(--gold)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>
    </div>
  )
}

function PreviewRow({ label, value, type = 'normal', isDeduction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ 
        fontSize: 14, 
        fontWeight: type === 'bold' ? 800 : 700,
        color: isDeduction ? '#ef4444' : type === 'bold' ? 'var(--navy)' : 'var(--text)'
      }}>
        {type === 'text' ? value : <div style={{ display: 'flex', alignItems: 'center' }}>₹<AnimatedNumber value={parseFloat(value || 0)} decimals={0} /></div>}
      </span>
    </div>
  )
}

export default function GeneratePayslip() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [staffList, setStaffList] = useState([])
  useEffect(() => {
    api.get('/staff').then(res => setStaffList(res.data.data)).catch(console.error)
  }, [])

  const [step, setStep] = useState(user?.companyName ? 1 : 0)
  const [form, setForm] = useState(() => {
    let initialValues = { ...INITIAL };
    if (user) {
      initialValues = {
        ...initialValues,
        companyName: user.companyName || '',
        companyAddress: user.companyAddress || '',
        companyEmail: user.companyEmail || '',
        companyPhone: user.companyPhone || '',
        companyCIN: user.companyCIN || '',
        companyLogo: user.companyLogo || '',
      };
    }
    
    if (location.state?.duplicateData) {
      const { _id, createdAt, updatedAt, __v, user: _user, ...rest } = location.state.duplicateData;
      return { ...initialValues, ...rest };
    }
    
    if (location.state?.predefinedStaff) {
      const s = location.state.predefinedStaff;
      initialValues = {
        ...initialValues,
        employmentType: s.type.toLowerCase(),
        employeeName: s.fullName,
        employeeEmail: s.email,
        designation: s.designation || '',
        department: s.department || '',
        dateOfJoining: s.joiningDate ? s.joiningDate.split('T')[0] : '',
        panNumber: s.financials?.panNumber || '',
        bankAccount: s.financials?.accountNumber || '',
        bankName: s.financials?.bankName || '',
        annualCTC: s.type === 'Employee' ? (s.salaryDetails?.annualCTC || '') : '',
        baseSalary: s.type === 'Intern' ? (s.salaryDetails?.baseSalary || '') : '',
      }
    }
    
    return initialValues;
  })
  
  const [submitting, setSubmitting] = useState(false)

  const totals = useMemo(() => {
    const annualCTC = parseFloat(form.annualCTC) || 0;
    const workingDays = parseInt(form.workingDays) || 26;
    const paidDays = parseInt(form.paidDays) || workingDays;
    const prorationFactor = workingDays > 0 ? (paidDays / workingDays) : 1;

    if (form.employmentType === 'intern') {
      const baseMonthly = parseFloat(form.baseSalary) || 0;
      const lossOfPay = workingDays > 0 ? Math.round((baseMonthly / workingDays) * Math.max(0, workingDays - paidDays)) : 0;
      const netStipend = baseMonthly - lossOfPay;
      return { basic: baseMonthly, hra: 0, special: 0, gross: baseMonthly, pf: 0, esi: 0, pt: 0, lossOfPay: lossOfPay, deductions: lossOfPay, net: netStipend }
    }

    const basicAnnual = annualCTC * 0.5;
    const hraAnnual = basicAnnual * 0.5;
    const employerPFAnnual = basicAnnual * 0.12; 
    const gratuityAnnual = basicAnnual * 0.0481;
    const retiralsAnnual = employerPFAnnual + gratuityAnnual;
    const grossAnnual = annualCTC - retiralsAnnual;
    const specialAnnual = grossAnnual - (basicAnnual + hraAnnual);

    const standardBasic = Math.round(basicAnnual / 12);
    const standardHra = Math.round(hraAnnual / 12);
    const standardSpecial = Math.round(specialAnnual / 12);

    const basic = Math.round(standardBasic * prorationFactor);
    const hra = Math.round(standardHra * prorationFactor);
    const special = Math.round(standardSpecial * prorationFactor);
    const gross = basic + hra + special;

    const empPF = Math.round(basic * 0.12);
    const esi = gross <= 21000 ? Math.ceil(gross * 0.0075) : 0;
    const pt = (paidDays > 0 && gross >= 15000) ? 200 : (paidDays > 0 && gross >= 10000) ? 150 : 0; 
    const tds = Math.round(parseFloat(form.tds) || 0);
    const loan = Math.round(parseFloat(form.loanDeduction) || 0);

    const deductions = empPF + esi + pt + tds + loan;
    const net = Math.round(gross - deductions);

    return { basic, hra, special, gross, pf: empPF, esi, pt, deductions, net, lossOfPay: 0 }
  }, [form.annualCTC, form.baseSalary, form.employmentType, form.workingDays, form.paidDays, form.tds, form.loanDeduction]);

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
      const payload = {
        ...form,
        basicSalary: totals.basic,
        hra: totals.hra,
        specialAllowance: totals.special,
        providentFund: totals.pf,
        esi: totals.esi,
        professionalTax: totals.pt,
        stipend: form.employmentType === 'intern' ? totals.gross : 0,
        grossEarnings: totals.gross,
        totalDeductions: totals.deductions,
        netSalary: totals.net,
      };
      const res = await api.post('/payslips', payload)
      toast.success('Payslip generated successfully!')
      navigate(`/payslips/${res.data.data._id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to generate payslip')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="split-screen"
    >
      {/* LEFT: FORM ENGINE */}
      <div style={{ padding: 'clamp(24px, 5vw, 60px)', position: 'relative' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <header style={{ marginBottom: 48 }}>
            <div className="badge badge-navy" style={{ marginBottom: 12 }}>Statutory v2.6</div>
            <h1 style={{ color: 'var(--navy)', marginBottom: 12, letterSpacing: '-0.03em' }}>Payroll Engine</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 500 }}>Generate localized Indian payslips with 2026 tax standards.</p>
          </header>

          <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 24px)', marginBottom: 48, paddingBottom: 16, borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
            <StepLabel num={1} label="Identity" active={step === 1} completed={step > 1} />
            <StepLabel num={2} label="Timeline" active={step === 2} completed={step > 2} />
            <StepLabel num={3} label="Payroll" active={step === 3} completed={step > 3} />
          </div>

          <form onSubmit={e => { e.preventDefault(); step < 3 ? setStep(s => s + 1) : handleSubmit() }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Employment Category</label>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 32, background: 'var(--bg)', padding: 6, borderRadius: 16, border: '1px solid var(--border)' }}>
                    {['regular', 'intern'].map(type => (
                      <button 
                        key={type} type="button"
                        onClick={() => setForm({...form, employmentType: type})}
                        style={{ 
                          flex: 1, padding: '12px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700,
                          background: form.employmentType === type ? 'var(--surface)' : 'transparent',
                          color: form.employmentType === type ? 'var(--navy)' : 'var(--text-muted)',
                          boxShadow: form.employmentType === type ? 'var(--shadow)' : 'none',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >{type === 'regular' ? 'Regular Employee' : 'Internship'}</button>
                    ))}
                  </div>

                  <div style={{ position: 'relative', marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Auto-fill from Staff Directory</label>
                    <select 
                      onChange={(e) => {
                        const s = staffList.find(x => x._id === e.target.value);
                        if(s) {
                           setForm(f => ({
                             ...f,
                             employmentType: s.type.toLowerCase(),
                             employeeName: s.fullName,
                             employeeEmail: s.email,
                             designation: s.designation || '',
                             department: s.department || '',
                             dateOfJoining: s.joiningDate ? s.joiningDate.split('T')[0] : '',
                             panNumber: s.financials?.panNumber || '',
                             bankAccount: s.financials?.accountNumber || '',
                             bankName: s.financials?.bankName || '',
                             annualCTC: s.type === 'Employee' ? (s.salaryDetails?.annualCTC || '') : f.annualCTC,
                             baseSalary: s.type === 'Intern' ? (s.salaryDetails?.baseSalary || '') : f.baseSalary,
                           }))
                        }
                      }}
                      className="btn-hover" style={{ width: '100%', padding: '12px 14px', border: '2px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', outline: 'none' }}
                    >
                      <option value="">-- Select Staff Member (Optional) --</option>
                      {staffList.filter(s => s.type.toLowerCase() === form.employmentType).length === 0 && (
                        <option value="" disabled>No {form.employmentType === 'regular' ? 'Employees' : 'Interns'} found in directory.</option>
                      )}
                      {staffList.filter(s => s.type.toLowerCase() === form.employmentType).map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.type})</option>)}
                    </select>
                  </div>

                  <InputField label="Employee Name" required value={form.employeeName} onChange={e => setForm({...form, employeeName: e.target.value})} placeholder="Full Name" icon={User} />
                  <div className="grid-2">
                    <InputField label="ID Code" required value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} placeholder="EMP-001" />
                    <InputField label="Designation" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Role" />
                  </div>
                  <InputField label="Department" required value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Engineering" />
                  <InputField label="Employee Email" required type="email" value={form.employeeEmail} onChange={e => setForm({...form, employeeEmail: e.target.value})} placeholder="email@company.com" icon={Send} />
                  <div className="grid-2">
                    <InputField label="PAN Number" value={form.panNumber} onChange={e => setForm({...form, panNumber: e.target.value})} placeholder="ABCDE1234F" />
                    <InputField label="PF Number" value={form.pfNumber} onChange={e => setForm({...form, pfNumber: e.target.value})} placeholder="XX/XXX/0000000" />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                  <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Pay Month</label>
                      <select value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="btn-hover" style={{ width: '100%', padding: '14px', border: '2px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', outline: 'none' }}>
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Year</label>
                      <select value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="btn-hover" style={{ width: '100%', padding: '14px', border: '2px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', outline: 'none' }}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <InputField label="Date of Joining" type="date" value={form.dateOfJoining} onChange={e => setForm({...form, dateOfJoining: e.target.value})} icon={Calendar} />
                    <InputField label="Payout Date" type="date" value={form.payDate} onChange={e => setForm({...form, payDate: e.target.value})} icon={Calendar} />
                  </div>
                  <div className="grid-2" style={{ padding: 20, background: 'var(--bg)', borderRadius: 20, border: '1px solid var(--border)' }}>
                    <InputField label="Working Days" type="number" min="0" max="31" value={form.workingDays} onChange={e => setForm({...form, workingDays: Math.max(0, parseInt(e.target.value) || 0)})} />
                    <InputField label="Paid Days" type="number" min="0" max="31" value={form.paidDays} onChange={e => setForm({...form, paidDays: Math.max(0, parseInt(e.target.value) || 0)})} />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                  {form.employmentType === 'intern' ? (
                     <InputField label="Monthly Stipend (Base Salary)" required type="number" min="0" value={form.baseSalary || ''} onChange={e => setForm({...form, baseSalary: Math.max(0, parseFloat(e.target.value) || 0)})} placeholder="Stipend in INR" icon={IndianRupee} />
                  ) : (
                     <InputField label="Annual Cost to Company (CTC)" required type="number" min="0" value={form.annualCTC} onChange={e => setForm({...form, annualCTC: Math.max(0, parseFloat(e.target.value) || 0)})} placeholder="Salary in INR" icon={IndianRupee} />
                  )}
                  
                  {form.employmentType === 'regular' && (
                    <div style={{ padding: 24, background: 'var(--bg)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
                      <div className="grid-2">
                        <InputField label="TDS" type="number" min="0" value={form.tds} onChange={e => setForm({...form, tds: Math.max(0, parseFloat(e.target.value) || 0)})} placeholder="0" />
                        <InputField label="Loan/Recovery" type="number" min="0" value={form.loanDeduction} onChange={e => setForm({...form, loanDeduction: Math.max(0, parseFloat(e.target.value) || 0)})} placeholder="0" />
                      </div>
                    </div>
                  )}
                  <InputField label="Bank Account (Masked)" value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} placeholder="Optional Account No" icon={Landmark} />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 14, marginTop: 40 }}>
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} style={{ width: 110, height: 52, borderRadius: 14, border: '2px solid var(--border)', background: 'var(--surface)', fontWeight: 700, cursor: 'pointer' }}>Back</button>
              )}
              <button 
                type="submit" disabled={submitting} className="btn-hover"
                style={{ 
                  flex: 1, height: 52, borderRadius: 14, border: 'none', 
                  background: submitting ? 'var(--text-light)' : 'var(--navy)', color: 'white', fontWeight: 800, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)'
                }}
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : step === 3 ? 'Generate Professional Slip' : 'Next Stage'}
                {step < 3 && <ChevronRight size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT: PROFESSIONAL PREVIEW */}
      <div style={{ 
        background: 'var(--bg)', borderLeft: '1px solid var(--border)', 
        padding: 'clamp(20px, 4vw, 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100%'
      }}>
        <div style={{ width: '100%', maxWidth: 500 }} className="fade-in">
          <div className="preview-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 32, borderBottom: '2px solid var(--bg)', paddingBottom: 24, gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {form.companyLogo && (
                  <img src={form.companyLogo} alt="Logo" style={{ height: 48, width: 'auto', borderRadius: 12, objectFit: 'contain', background: '#f8fafc', padding: 4 }} />
                )}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{form.companyName || 'Corporate Entity'}</div>
                  <div className="badge badge-gold" style={{ marginTop: 2 }}>Certified Payload</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Period</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{form.month} {form.year}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, padding: 16, background: 'var(--bg)', borderRadius: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 900 }}>
                {(form.employeeName || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{form.employeeName || 'Active User'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{form.designation || 'Position Unspecified'} · {form.department}</div>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <PreviewRow label="Identity Code" value={form.employeeId || '—'} type="text" />
              {form.employmentType === 'intern' ? (
                <>
                  <PreviewRow label="Monthly Stipend (Base)" value={totals.basic} />
                  {totals.lossOfPay > 0 && <PreviewRow label="Absent Deduction (Loss of Pay)" value={totals.lossOfPay} isDeduction />}
                </>
              ) : (
                <>
                  <PreviewRow label="Basic Component" value={totals.basic} />
                  <PreviewRow label="HRA Component" value={totals.hra} />
                  <PreviewRow label="Other Allowances" value={totals.special} />
                  <PreviewRow label="Statutory PF" value={totals.pf} isDeduction />
                  <PreviewRow label="TDS/Tax" value={totals.deductions - totals.pf} isDeduction />
                </>
              )}
              <PreviewRow label="Gross Earnings" value={totals.gross} type="bold" />
              <PreviewRow label="Total Deductions" value={totals.deductions} isDeduction type="bold" />
            </div>

            <div style={{ 
              background: 'var(--navy)', color: 'white', padding: '24px', 
              borderRadius: 24, textAlign: 'center', boxShadow: '0 20px 40px -10px rgba(15,23,42,0.4)'
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                {form.employmentType === 'intern' ? 'Net Stipend Payable' : 'Net Salary Payable'}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ₹<AnimatedNumber value={totals.net} decimals={0} />
              </div>
            </div>
            
            <div style={{ marginTop: 24, padding: '12px', background: 'var(--bg)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={16} color="var(--text-muted)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>System generated professional artifact (ISO-Standard)</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
