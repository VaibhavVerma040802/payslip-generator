import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Building2, User, Calendar, TrendingUp, Minus, ChevronRight, ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react'
import api from '../api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

const INITIAL = {
  // Company
  companyName: '', companyAddress: '', companyEmail: '', companyPhone: '', companyCIN: '',
  // Employee
  employeeName: '', employeeId: '', designation: '', department: '', employeeEmail: '',
  dateOfJoining: '', bankAccount: '', bankName: '', panNumber: '', pfNumber: '',
  // Period
  month: MONTHS[new Date().getMonth()], year: CURRENT_YEAR,
  payDate: new Date().toISOString().split('T')[0],
  workingDays: 26, paidDays: 26,
  // Earnings
  basicSalary: '', hra: '', conveyanceAllowance: '', medicalAllowance: '',
  specialAllowance: '', otherEarnings: '', otherEarningsLabel: 'Other Earnings',
  // Deductions
  providentFund: '', esi: '', tds: '', professionalTax: '',
  loanDeduction: '', otherDeductions: '', otherDeductionsLabel: 'Other Deductions',
  notes: '',
}

const STEPS = [
  { label: 'Company', icon: Building2 },
  { label: 'Employee', icon: User },
  { label: 'Pay Period', icon: Calendar },
  { label: 'Salary', icon: TrendingUp },
  { label: 'Deductions', icon: Minus },
]

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: 0.8,
        textTransform: 'uppercase', marginBottom: 14, paddingBottom: 8,
        borderBottom: '2px solid var(--gold-pale)',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Row({ children, cols = 2 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '14px 18px',
      marginBottom: 14,
    }}>
      {children}
    </div>
  )
}

function Field({ label, name, form, setForm, type = 'text', required = false, placeholder, suffix, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          required={required}
          value={form[name]}
          placeholder={placeholder}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          style={{
            width: '100%', padding: '9px 12px',
            border: '1.5px solid var(--border)',
            borderRadius: 8, fontSize: 13.5,
            color: 'var(--text)', background: 'var(--surface)',
            outline: 'none', transition: 'border-color 0.15s',
            paddingRight: suffix ? '40px' : '12px',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--navy)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'var(--text-light)',
          }}>{suffix}</span>
        )}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 3 }}>{hint}</div>}
    </div>
  )
}

function SelectField({ label, name, form, setForm, options, required }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      <select
        value={form[name]}
        required={required}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        style={{
          width: '100%', padding: '9px 12px',
          border: '1.5px solid var(--border)',
          borderRadius: 8, fontSize: 13.5,
          color: 'var(--text)', background: 'var(--surface)',
          outline: 'none', cursor: 'pointer',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--navy)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  )
}

function NumberField({ label, name, form, setForm, placeholder }) {
  const num = parseFloat(form[name]) || 0
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 13, color: 'var(--text-muted)', fontWeight: 600,
        }}>₹</span>
        <input
          type="number"
          min="0"
          value={form[name]}
          placeholder={placeholder || '0'}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          style={{
            width: '100%', padding: '9px 12px 9px 26px',
            border: '1.5px solid var(--border)',
            borderRadius: 8, fontSize: 13.5,
            color: 'var(--text)', background: 'var(--surface)',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--navy)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>
    </div>
  )
}

// Salary summary sidebar
function SalarySummary({ form }) {
  const n = (k) => parseFloat(form[k]) || 0
  const gross = n('basicSalary') + n('hra') + n('conveyanceAllowance') + n('medicalAllowance') + n('specialAllowance') + n('otherEarnings')
  const deductions = n('providentFund') + n('esi') + n('tds') + n('professionalTax') + n('loanDeduction') + n('otherDeductions')
  const net = gross - deductions

  const fmt = (v) => '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 0 })

  return (
    <div style={{
      background: 'var(--navy-dark)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      position: 'sticky',
      top: 24,
      color: 'white',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--gold)' }}>
        Live Summary
      </div>

      {[
        ['Basic Salary', n('basicSalary')],
        ['HRA', n('hra')],
        ['Conveyance', n('conveyanceAllowance')],
        ['Medical', n('medicalAllowance')],
        ['Special', n('specialAllowance')],
        ['Other Earnings', n('otherEarnings')],
      ].filter(r => r[1] > 0).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{k}</span>
          <span style={{ color: '#d1fae5' }}>{fmt(v)}</span>
        </div>
      ))}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Gross</span>
          <span style={{ color: 'var(--gold)' }}>{fmt(gross)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total Deductions</span>
          <span style={{ color: '#fca5a5' }}>−{fmt(deductions)}</span>
        </div>
      </div>

      <div style={{
        background: 'rgba(201,168,76,0.15)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 10,
        padding: '12px 14px',
        marginTop: 8,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>Net Salary</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{fmt(net)}</div>
      </div>
    </div>
  )
}

export default function GeneratePayslip() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL)
  const [submitting, setSubmitting] = useState(false)

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        workingDays: parseInt(form.workingDays),
        paidDays: parseInt(form.paidDays),
        year: parseInt(form.year),
        basicSalary: parseFloat(form.basicSalary) || 0,
        hra: parseFloat(form.hra) || 0,
        conveyanceAllowance: parseFloat(form.conveyanceAllowance) || 0,
        medicalAllowance: parseFloat(form.medicalAllowance) || 0,
        specialAllowance: parseFloat(form.specialAllowance) || 0,
        otherEarnings: parseFloat(form.otherEarnings) || 0,
        providentFund: parseFloat(form.providentFund) || 0,
        esi: parseFloat(form.esi) || 0,
        tds: parseFloat(form.tds) || 0,
        professionalTax: parseFloat(form.professionalTax) || 0,
        loanDeduction: parseFloat(form.loanDeduction) || 0,
        otherDeductions: parseFloat(form.otherDeductions) || 0,
      }
      const res = await api.post('/payslips', payload)
      toast.success('Payslip created successfully!')
      navigate(`/payslips/${res.data.data._id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to create payslip')
    } finally {
      setSubmitting(false)
    }
  }

  const showSummary = step >= 3

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>
          Generate Payslip
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Fill in the details to create a new payslip.</p>
      </div>

      {/* Stepper */}
      <div className="fade-up" style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', padding: '10px 16px',
        marginBottom: 28, boxShadow: 'var(--shadow-sm)',
        overflowX: 'auto',
      }}>
        {STEPS.map(({ label, icon: Icon }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div
              onClick={() => setStep(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
                background: step === i ? 'var(--navy)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {i < step ? (
                <CheckCircle2 size={16} color="var(--green)" />
              ) : (
                <Icon size={15} color={step === i ? 'var(--gold)' : 'var(--text-muted)'} />
              )}
              <span style={{
                fontSize: 13, fontWeight: step === i ? 600 : 400,
                color: step === i ? 'white' : i < step ? 'var(--green)' : 'var(--text-muted)',
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 4px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Form + Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: showSummary ? '1fr 260px' : '1fr', gap: 24 }}>
        {/* Form Card */}
        <div className="fade-in" style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', padding: '28px 32px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Step 0: Company */}
          {step === 0 && (
            <div>
              <FieldGroup label="Company Information">
                <Field label="Company Name" name="companyName" form={form} setForm={setForm} required placeholder="Acme Technologies Pvt. Ltd." />
                <div style={{ marginTop: 14 }}>
                  <Field label="Company Address" name="companyAddress" form={form} setForm={setForm} required placeholder="123 Business Park, Mumbai, Maharashtra 400001" />
                </div>
                <Row>
                  <Field label="Company Email" name="companyEmail" form={form} setForm={setForm} type="email" placeholder="hr@acme.com" />
                  <Field label="Company Phone" name="companyPhone" form={form} setForm={setForm} placeholder="+91 98765 43210" />
                </Row>
                <Field label="CIN / Registration No." name="companyCIN" form={form} setForm={setForm} placeholder="U72900MH2020PTC123456" />
              </FieldGroup>
            </div>
          )}

          {/* Step 1: Employee */}
          {step === 1 && (
            <div>
              <FieldGroup label="Basic Details">
                <Row>
                  <Field label="Employee Name" name="employeeName" form={form} setForm={setForm} required placeholder="Rahul Sharma" />
                  <Field label="Employee ID" name="employeeId" form={form} setForm={setForm} required placeholder="EMP-001" />
                </Row>
                <Row>
                  <Field label="Designation" name="designation" form={form} setForm={setForm} required placeholder="Software Engineer" />
                  <Field label="Department" name="department" form={form} setForm={setForm} required placeholder="Engineering" />
                </Row>
                <Field label="Employee Email" name="employeeEmail" form={form} setForm={setForm} required type="email" placeholder="rahul@acme.com" hint="Payslip will be emailed to this address" />
                <div style={{ marginTop: 14 }}>
                  <Field label="Date of Joining" name="dateOfJoining" form={form} setForm={setForm} type="date" />
                </div>
              </FieldGroup>
              <FieldGroup label="Financial Details">
                <Row>
                  <Field label="PAN Number" name="panNumber" form={form} setForm={setForm} placeholder="ABCDE1234F" />
                  <Field label="PF Account No." name="pfNumber" form={form} setForm={setForm} placeholder="MH/12345/123" />
                </Row>
                <Row>
                  <Field label="Bank Account No." name="bankAccount" form={form} setForm={setForm} placeholder="Account number" hint="Last 4 digits shown on payslip" />
                  <Field label="Bank Name" name="bankName" form={form} setForm={setForm} placeholder="HDFC Bank" />
                </Row>
              </FieldGroup>
            </div>
          )}

          {/* Step 2: Period */}
          {step === 2 && (
            <FieldGroup label="Pay Period">
              <Row>
                <SelectField label="Month" name="month" form={form} setForm={setForm} required options={MONTHS} />
                <SelectField label="Year" name="year" form={form} setForm={setForm} required options={YEARS} />
              </Row>
              <Field label="Pay Date" name="payDate" form={form} setForm={setForm} required type="date" />
              <Row>
                <Field label="Working Days" name="workingDays" form={form} setForm={setForm} type="number" />
                <Field label="Paid Days" name="paidDays" form={form} setForm={setForm} type="number" />
              </Row>
            </FieldGroup>
          )}

          {/* Step 3: Earnings */}
          {step === 3 && (
            <FieldGroup label="Earnings">
              <Row>
                <NumberField label="Basic Salary" name="basicSalary" form={form} setForm={setForm} />
                <NumberField label="HRA" name="hra" form={form} setForm={setForm} />
              </Row>
              <Row>
                <NumberField label="Conveyance Allowance" name="conveyanceAllowance" form={form} setForm={setForm} />
                <NumberField label="Medical Allowance" name="medicalAllowance" form={form} setForm={setForm} />
              </Row>
              <Row>
                <NumberField label="Special Allowance" name="specialAllowance" form={form} setForm={setForm} />
                <NumberField label="Other Earnings" name="otherEarnings" form={form} setForm={setForm} />
              </Row>
              {parseFloat(form.otherEarnings) > 0 && (
                <Field label="Other Earnings Label" name="otherEarningsLabel" form={form} setForm={setForm} placeholder="Bonus / Incentive" />
              )}
            </FieldGroup>
          )}

          {/* Step 4: Deductions */}
          {step === 4 && (
            <>
              <FieldGroup label="Deductions">
                <Row>
                  <NumberField label="Provident Fund (PF)" name="providentFund" form={form} setForm={setForm} />
                  <NumberField label="ESI" name="esi" form={form} setForm={setForm} />
                </Row>
                <Row>
                  <NumberField label="TDS" name="tds" form={form} setForm={setForm} />
                  <NumberField label="Professional Tax" name="professionalTax" form={form} setForm={setForm} />
                </Row>
                <Row>
                  <NumberField label="Loan Deduction" name="loanDeduction" form={form} setForm={setForm} />
                  <NumberField label="Other Deductions" name="otherDeductions" form={form} setForm={setForm} />
                </Row>
                {parseFloat(form.otherDeductions) > 0 && (
                  <Field label="Other Deductions Label" name="otherDeductionsLabel" form={form} setForm={setForm} placeholder="Advance / Penalty" />
                )}
              </FieldGroup>

              <FieldGroup label="Additional Notes">
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special notes to include on the payslip..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8, fontSize: 13.5, resize: 'vertical',
                    color: 'var(--text)', fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </FieldGroup>
            </>
          )}

          {/* Navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)',
          }}>
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1.5px solid var(--border)',
                borderRadius: 8, padding: '9px 18px', cursor: step === 0 ? 'not-allowed' : 'pointer',
                color: step === 0 ? 'var(--text-light)' : 'var(--text)',
                fontWeight: 500, fontSize: 13.5,
              }}
            >
              <ChevronLeft size={15} /> Previous
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--navy)', color: 'white',
                  border: 'none', borderRadius: 8, padding: '9px 22px',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13.5,
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: submitting ? 'var(--text-light)' : 'var(--gold)',
                  color: 'var(--navy-dark)',
                  border: 'none', borderRadius: 8, padding: '10px 24px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 14,
                }}
              >
                {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <>✓ Generate Payslip</>}
              </button>
            )}
          </div>
        </div>

        {/* Live Summary */}
        {showSummary && <SalarySummary form={form} />}
      </div>
    </div>
  )
}
