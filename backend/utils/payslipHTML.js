/**
 * Professional HTML template for Payslip generation
 * This is used by Puppeteer to generate high-fidelity PDFs
 */
function generatePayslipHTML(p) {
  const formatINR = (amount) => {
    const num = parseFloat(amount) || 0;
    return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convert(n) {
      if (n === 0) return '';
      if (n < 20) return ones[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
      if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
      if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000);
      return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000);
    }

    const integer = Math.floor(num);
    const decimal = Math.round((num - integer) * 100);
    let words = convert(integer).trim() || 'Zero';
    words += ' Rupees';
    if (decimal > 0) words += ' and ' + convert(decimal).trim() + ' Paise';
    return words + ' Only';
  };

  const earnings = [
    { label: 'Basic Salary (50%)', amount: p.basicSalary },
    { label: 'House Rent Allowance (40%)', amount: p.hra },
    { label: 'Special Allowance', amount: p.specialAllowance },
    { label: 'Employer PF Contribution', amount: p.employerPF },
  ].filter(e => e.amount > 0);

  if (p.otherEarnings > 0) {
    earnings.push({ label: p.otherEarningsLabel || 'Other Earnings', amount: p.otherEarnings });
  }

  const deductions = [
    { label: 'Employee PF', amount: p.providentFund },
    { label: 'ESI', amount: p.esi },
    { label: 'Professional Tax', amount: p.professionalTax },
    { label: 'Tax Deducted (TDS)', amount: p.tds },
    { label: 'Loan Deduction', amount: p.loanDeduction },
  ].filter(d => d.amount > 0);

  if (p.otherDeductions > 0) {
    deductions.push({ label: p.otherDeductionsLabel || 'Other Deductions', amount: p.otherDeductions });
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${p.employeeName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    :root {
      --navy: #1e3a5f;
      --gold: #c9a84c;
      --light-gold: #f0d98a;
      --border: rgba(15, 23, 42, 0.08);
      --text: #1e293b;
      --text-muted: #64748b;
      --bg: #f8fafc;
      --surface: #ffffff;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #fff; color: var(--text); font-size: 11px; line-height: 1.4; -webkit-print-color-adjust: exact; }

    .page { width: 210mm; min-height: 297mm; padding: 0; margin: 0; position: relative; }

    /* Header */
    .header { background: var(--navy); color: #fff; padding: 40px 60px; position: relative; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-accent { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--gold); }
    
    .company-details { display: flex; gap: 24px; align-items: center; max-width: 65%; }
    .logo { height: 50px; width: auto; border-radius: 8px; background: #fff; padding: 4px; }
    .company-info h1 { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
    .company-info p { font-size: 8.5px; color: var(--light-gold); opacity: 0.9; }

    .slip-type { text-align: right; }
    .slip-type h2 { font-size: 14px; font-weight: 800; color: var(--gold); letter-spacing: 0.5px; margin-bottom: 4px; }
    .slip-type .period { font-size: 11px; font-weight: 600; color: #fff; text-transform: uppercase; }
    .slip-type .pay-date { font-size: 8.5px; color: rgba(255,255,255,0.6); margin-top: 4px; }

    /* Content Wrapper */
    .content { padding: 40px 60px; }

    /* Employee Section */
    .section-title { font-size: 9px; font-weight: 800; color: var(--navy); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; margin-left: 4px; }
    .title-line { height: 1.5px; width: 100px; background: var(--gold); margin-bottom: 24px; margin-left: 4px; }

    .employee-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 40px; margin-bottom: 40px; }
    .info-row { display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid rgba(0,0,0,0.03); }
    .info-row span:first-child { color: var(--text-muted); font-weight: 500; font-size: 9px; }
    .info-row span:last-child { color: var(--text); font-weight: 700; font-size: 9.5px; }

    /* Days Summary */
    .days-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
    .day-box { padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border); }
    .day-box.active { background: var(--navy); color: #fff; border-color: var(--navy); }
    .day-box .label { font-size: 7.5px; font-weight: 600; margin-bottom: 4px; opacity: 0.8; }
    .day-box .value { font-size: 16px; font-weight: 800; }

    /* Tables */
    .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; table-layout: fixed; }
    .salary-table th { background: var(--navy); color: var(--gold); font-size: 9px; font-weight: 800; text-align: left; padding: 10px 16px; border-right: 1px solid rgba(255,255,255,0.1); }
    .salary-table th:last-child { border-right: none; }
    .salary-table td { padding: 0; width: 50%; vertical-align: top; border: 1px solid var(--border); }
    
    .table-container { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .sub-table { width: 100%; border-collapse: collapse; }
    .sub-table tr:nth-child(even) { background: var(--bg); }
    .sub-table td { padding: 10px 16px; font-size: 9.5px; border: none; }
    .sub-table td:last-child { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

    .totals { background: #eef2ff; }
    .totals td { padding: 10px 16px; font-size: 10px; font-weight: 800; color: var(--navy); border-top: 2px solid var(--navy); }
    .totals td:last-child { text-align: right; }

    /* Net Salary */
    .net-band { background: var(--navy); border-radius: 16px; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; color: #fff; position: relative; overflow: hidden; margin-top: 32px; }
    .net-band::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--gold); }
    .net-label h3 { font-size: 11px; font-weight: 800; color: var(--gold); margin-bottom: 4px; }
    .net-label p { font-size: 9px; color: #aac4e0; font-weight: 500; font-style: italic; }
    .net-value { font-size: 28px; font-weight: 800; }

    /* Signature Area */
    .signatures { display: flex; justify-content: space-between; margin-top: 100px; padding: 0 4px; }
    .sig-box { width: 220px; text-align: center; }
    .sig-line { height: 1px; background: var(--border); margin-bottom: 8px; }
    .sig-label { font-size: 8px; color: var(--text-muted); font-weight: 600; }

    /* Footer */
    .footer { position: absolute; bottom: 0; left: 0; right: 0; background: var(--navy); padding: 12px 60px; color: #aac4e0; font-size: 8px; text-align: center; border-top: 2px solid var(--gold); }

    @media print {
      .page { margin: 0; box-shadow: none; width: 210mm; height: 297mm; }
      body { background: #fff; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-accent"></div>
      <div class="company-details">
        ${p.companyLogo ? `<img src="${p.companyLogo}" class="logo" />` : ''}
        <div class="company-info">
          <h1>${p.companyName.toUpperCase()}</h1>
          <p>${p.companyAddress}</p>
          <p>${p.companyEmail} ${p.companyPhone ? ' | ' + p.companyPhone : ''}</p>
        </div>
      </div>
      <div class="slip-type">
        <h2>SALARY SLIP</h2>
        <div class="period">${p.month} ${p.year}</div>
        <div class="pay-date">Pay Date: ${p.payDate}</div>
      </div>
    </div>

    <div class="content">
      <div class="section-title">Employee Details</div>
      <div class="title-line"></div>
      
      <div class="employee-card">
        <div class="info-row"><span>Name</span><span>${p.employeeName}</span></div>
        <div class="info-row"><span>Date of Joining</span><span>${p.dateOfJoining || '—'}</span></div>
        <div class="info-row"><span>Employee ID</span><span>${p.employeeId}</span></div>
        <div class="info-row"><span>PAN Number</span><span>${p.panNumber || '—'}</span></div>
        <div class="info-row"><span>Designation</span><span>${p.designation}</span></div>
        <div class="info-row"><span>PF Number</span><span>${p.pfNumber || '—'}</span></div>
        <div class="info-row"><span>Department</span><span>${p.department}</span></div>
        <div class="info-row"><span>Bank Account</span><span>${p.bankAccount ? '****' + p.bankAccount.slice(-4) : '—'}</span></div>
      </div>

      <div class="days-grid">
        <div class="day-box active">
          <div class="label">WORKING DAYS</div>
          <div class="value">${p.workingDays}</div>
        </div>
        <div class="day-box">
          <div class="label">PAID DAYS</div>
          <div class="value">${p.paidDays}</div>
        </div>
        <div class="day-box">
          <div class="label">LOSS OF PAY</div>
          <div class="value">${p.workingDays - p.paidDays}</div>
        </div>
      </div>

      <div class="table-container">
        <table class="salary-table">
          <thead>
            <tr>
              <th colspan="2">EARNINGS</th>
              <th colspan="2" style="border-left: 1px solid rgba(255,255,255,0.1);">DEDUCTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2">
                <table class="sub-table">
                  ${earnings.map(e => `<tr><td>${e.label}</td><td>${formatINR(e.amount).replace('Rs. ', '')}</td></tr>`).join('')}
                  ${Array(Math.max(0, deductions.length - earnings.length)).fill('<tr><td>&nbsp;</td><td>&nbsp;</td></tr>').join('')}
                </table>
              </td>
              <td colspan="2">
                <table class="sub-table">
                  ${deductions.map(d => `<tr><td>${d.label}</td><td>${formatINR(d.amount).replace('Rs. ', '')}</td></tr>`).join('')}
                  ${Array(Math.max(0, earnings.length - deductions.length)).fill('<tr><td>&nbsp;</td><td>&nbsp;</td></tr>').join('')}
                </table>
              </td>
            </tr>
            <tr class="totals">
              <td>GROSS EARNINGS</td>
              <td style="text-align: right;">${formatINR(p.grossEarnings).replace('Rs. ', '')}</td>
              <td style="border-left: 1px solid var(--border);">TOTAL DEDUCTIONS</td>
              <td style="text-align: right;">${formatINR(p.totalDeductions).replace('Rs. ', '')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="net-band">
        <div class="net-label">
          <h3>NET SALARY PAYABLE</h3>
          <p>(${numberToWords(p.netSalary)})</p>
        </div>
        <div class="net-value">${formatINR(p.netSalary)}</div>
      </div>

      <div class="signatures">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">Employee's Signature</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-label">Authorized Signatory</div>
        </div>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated payslip and does not require a physical signature. | ${p.companyName}
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { generatePayslipHTML };
