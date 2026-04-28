const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

/**
 * Format a number as Indian Rupee string
 */
function formatINR(amount) {
  const num = parseFloat(amount) || 0;
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Convert number to words (Indian system)
 */
function numberToWords(num) {
  const amount = parseFloat(num) || 0;
  if (isNaN(amount) || amount === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (isNaN(n) || n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000);
    return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000);
  }

  const integer = Math.floor(amount);
  const decimal = Math.round((amount - integer) * 100);
  let words = convert(integer).trim() || 'Zero';
  words = words + ' Rupees';
  if (decimal > 0) words += ' and ' + convert(decimal).trim() + ' Paise';
  words += ' Only';
  return words;
}

/**
 * Generate the HTML content from the template
 */
function getHtmlContent(payslip) {
  const templatePath = path.join(__dirname, 'pdfTemplate.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Logo Handling
  let logoHtml = `<span class="logo-initials">${payslip.companyName.charAt(0)}</span>`;
  if (payslip.companyLogo && payslip.companyLogo.startsWith('data:image')) {
    logoHtml = `<img src="${payslip.companyLogo}" alt="Logo" />`;
  }

  // Earnings Rows
  const earnings = payslip.employmentType === 'intern' 
    ? [['Stipend', payslip.stipend || payslip.grossEarnings]]
    : [
        ['Basic Salary', payslip.basicSalary],
        ['HRA', payslip.hra],
        ['Special Allowance', payslip.specialAllowance],
        ['Employer PF', payslip.employerPF],
      ];
  if (payslip.otherEarnings > 0) earnings.push([payslip.otherEarningsLabel || 'Other Earnings', payslip.otherEarnings]);

  const earningsRowsHtml = earnings.map(e => `
    <tr>
      <td>${e[0]}</td>
      <td>${formatINR(e[1])}</td>
    </tr>
  `).join('');

  // Deductions Rows
  const deductions = [
    ['Employee PF', payslip.providentFund],
    ['ESI', payslip.esi],
    ['Professional Tax', payslip.professionalTax],
    ['TDS', payslip.tds],
    ['Loan Deduction', payslip.loanDeduction],
    [payslip.otherDeductionsLabel || 'Other Deductions', payslip.otherDeductions],
  ].filter(d => d[1] > 0);

  if (deductions.length === 0) deductions.push(['No Deductions', 0]);

  const deductionsRowsHtml = deductions.map(d => `
    <tr>
      <td>${d[0]}</td>
      <td>${formatINR(d[1])}</td>
    </tr>
  `).join('');

  // Reimbursements
  let reimbSection = '';
  if (payslip.reimbursements && payslip.reimbursements.length > 0) {
    const reimbRows = payslip.reimbursements.map(r => `
      <tr>
        <td>${r.label}</td>
        <td>${formatINR(r.amount)}</td>
      </tr>
    `).join('');
    reimbSection = `
      <div class="reimb-wrapper glass">
        <table>
          <thead>
            <tr>
              <th>Reimbursements</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${reimbRows}
          </tbody>
          <tfoot>
            <tr class="table-footer">
              <td>Total Reimbursements</td>
              <td>${formatINR(payslip.totalReimbursements)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  // Replace placeholders
  const replacements = {
    '{{LOGO_HTML}}': logoHtml,
    '{{COMPANY_NAME}}': payslip.companyName,
    '{{COMPANY_ADDRESS}}': payslip.companyAddress,
    '{{PAY_MONTH_YEAR}}': `${payslip.month} ${payslip.year}`,
    '{{EMPLOYEE_NAME}}': payslip.employeeName,
    '{{EMPLOYEE_ID}}': payslip.employeeId,
    '{{DESIGNATION}}': payslip.designation,
    '{{DEPARTMENT}}': payslip.department || 'General',
    '{{DATE_OF_JOINING}}': payslip.dateOfJoining || '—',
    '{{PAN_NUMBER}}': payslip.panNumber || '—',
    '{{ACCOUNT_NUMBER}}': payslip.bankAccount ? `****${payslip.bankAccount.slice(-4)}` : '—',
    '{{PF_NUMBER}}': payslip.pfNumber || '—',
    '{{NET_PAY}}': formatINR(payslip.netSalary),
    '{{PAID_DAYS}}': payslip.paidDays,
    '{{LOP_DAYS}}': payslip.workingDays - payslip.paidDays,
    '{{TOTAL_DAYS}}': payslip.workingDays,
    '{{EARNINGS_ROWS}}': earningsRowsHtml,
    '{{DEDUCTIONS_ROWS}}': deductionsRowsHtml,
    '{{GROSS_EARNINGS}}': formatINR(payslip.grossEarnings),
    '{{TOTAL_DEDUCTIONS}}': formatINR(payslip.totalDeductions),
    '{{REIMBURSEMENTS_SECTION}}': reimbSection,
    '{{TOTAL_NET_PAYABLE}}': formatINR(payslip.netSalary),
    '{{AMOUNT_IN_WORDS}}': numberToWords(payslip.netSalary)
  };

  Object.entries(replacements).forEach(([key, value]) => {
    html = html.split(key).join(value);
  });

  return html;
}

/**
 * Generate PDF buffer using Puppeteer
 */
async function generatePayslipBuffer(payslip) {
  let browser = null;
  try {
    const html = getHtmlContent(payslip);

    // Robust path detection for Local vs Vercel
    let executablePath = await chromium.executablePath();
    if (!executablePath && process.env.NODE_ENV === 'development') {
      // Fallback for Windows local dev
      if (process.platform === 'win32') {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      } else {
        executablePath = '/usr/bin/google-chrome';
      }
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    return pdf;
  } catch (err) {
    console.error('❌ PDF Generation Error:', err);
    throw err;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

/**
 * Stream PDF to response
 */
async function generatePayslipPDF(payslip, res) {
  try {
    const buffer = await generatePayslipBuffer(payslip);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Payslip_${payslip.employeeName.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.pdf"`
    );
    res.send(buffer);
  } catch (err) {
    console.error('CRITICAL: PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Critical error during PDF generation', details: err.message });
    }
  }
}

module.exports = {
  generatePayslipPDF,
  generatePayslipBuffer
};
