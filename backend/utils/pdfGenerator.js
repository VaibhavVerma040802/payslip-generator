const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Color palette — Three-tone BDA brand scheme
// Primary: #58833b (Forest Green) — headers, net salary band, table headers
// Secondary: #e5ebdd (Soft Sage) — employee info panel, alternate rows, totals row
// Tertiary: #ffffff (White) — table body rows, page background
const COLORS = {
  primary: '#58833b',    // Forest Green — primary backgrounds
  sage: '#e5ebdd',       // Soft Sage — secondary backgrounds
  white: '#ffffff',      // White — body rows, page
  primaryText: '#ffffff', // White text on green backgrounds
  sageText: '#1a2e0f',   // Dark green text on sage backgrounds
  greenText: '#58833b',  // Green text on white backgrounds
  gray: '#6b7280',       // Muted gray for labels
  lightGray: '#d1d5db',  // Light gray for dividers
  darkGray: '#1f2937',   // Near-black for primary text
  earningGreen: '#166534', // Deep green for earning amounts
  deductionRed: '#991b1b', // Deep red for deduction amounts
  // Legacy aliases for compatibility
  navy: '#58833b',
  gold: '#e5ebdd',
  lightGold: '#e5ebdd',
  offWhite: '#e5ebdd',
  darkGray2: '#374151',
  green: '#166534',
  red: '#991b1b',
  tableHeader: '#58833b',
  tableRow1: '#e5ebdd',
  tableRow2: '#ffffff',
  netBg: '#58833b',
  totalNetRow: '#e5ebdd',
};

// Font paths (Using process.cwd() for Vercel/production resilience)
const FONT_REGULAR_PATH = path.resolve(process.cwd(), 'backend/assets/fonts/Inter-Regular.ttf');
const FONT_BOLD_PATH = path.resolve(process.cwd(), 'backend/assets/fonts/Inter-Bold.ttf');

/**
 * Format a number as Indian Rupee string
 */
function formatINR(amount) {
  const num = parseFloat(amount) || 0;
  if (isNaN(num)) return 'Rs. 0.00';
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
 * Core drawing logic shared between direct download and email attachments.
 * Embeds custom fonts for layout stability with robust fallback.
 */
function drawPayslip(doc, payslip) {
  let fontRegular = 'Helvetica';
  let fontBold = 'Helvetica-Bold';

  // Register fonts defensively with double-layered catch logic
  try {
    if (fs.existsSync(FONT_REGULAR_PATH)) {
      try {
        doc.registerFont('Inter', FONT_REGULAR_PATH);
        fontRegular = 'Inter';
      } catch (err) {
        console.error(`❌ Inter Regular registration failed (Format Error): ${err.message}`);
        fontRegular = 'Helvetica'; // Explicit fallback on format error
      }
    } else {
      console.warn('⚠️ Inter Regular font file not found on disk.');
    }

    if (fs.existsSync(FONT_BOLD_PATH)) {
      try {
        doc.registerFont('Inter-Bold', FONT_BOLD_PATH);
        fontBold = 'Inter-Bold';
      } catch (err) {
        console.error(`❌ Inter Bold registration failed (Format Error): ${err.message}`);
        fontBold = 'Helvetica-Bold'; // Explicit fallback on format error
      }
    } else {
      console.warn('⚠️ Inter Bold font file not found on disk.');
    }
  } catch (err) {
    console.error('CRITICAL: Font registration logic crash:', err.message);
    fontRegular = 'Helvetica';
    fontBold = 'Helvetica-Bold';
  }

  // Final validation of font choice
  try {
    doc.font(fontRegular);
  } catch (e) {
    console.error('Emergency font switch to Helvetica');
    doc.font('Helvetica');
    fontRegular = 'Helvetica';
  }

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  // ── HEADER BAND — Forest Green primary background ──────────────────────
  doc.rect(0, 0, PAGE_W, 110).fill(COLORS.primary);
  doc.rect(0, 0, PAGE_W, 4).fill(COLORS.sage);

  let hasLogo = false;
  if (payslip.companyLogo && typeof payslip.companyLogo === 'string' && payslip.companyLogo.startsWith('data:image')) {
    try {
      const logoData = payslip.companyLogo.split(',')[1];
      if (logoData) {
        const logoBuffer = Buffer.from(logoData, 'base64');
        doc.image(logoBuffer, MARGIN, 24, { fit: [80, 50] });
        hasLogo = true;
      }
    } catch (e) {
      console.warn('⚠️ Logo render failed (Fallback to text):', e.message);
    }
  }

  const textX = hasLogo ? MARGIN + 95 : MARGIN;

  // Company name — white text on forest green
  doc
    .font(fontBold)
    .fontSize(18)
    .fillColor(COLORS.primaryText)
    .text(payslip.companyName.toUpperCase(), textX, 28, { width: CONTENT_W * 0.55 });

  // Company address — sage tint text on green
  doc
    .font(fontRegular)
    .fontSize(8)
    .fillColor(COLORS.sage)
    .text(payslip.companyAddress, textX, 50, { width: CONTENT_W * 0.55 });

  if (payslip.companyEmail) {
    doc.fillColor(COLORS.sage).text(
      (payslip.companyEmail || '') +
      (payslip.companyPhone ? '  |  ' + payslip.companyPhone : '') +
      (payslip.companyWebsite ? '  |  ' + payslip.companyWebsite : ''),
      textX, 65, { width: CONTENT_W * 0.65 }
    );
  }

  // Right side — PAYSLIP label in sage
  doc
    .font(fontBold)
    .fontSize(14)
    .fillColor(COLORS.sage)
    .text('PAYSLIP', MARGIN + CONTENT_W * 0.67, 28, { width: CONTENT_W * 0.33, align: 'right' });

  doc
    .font(fontRegular)
    .fontSize(10)
    .fillColor(COLORS.primaryText)
    .text(`${payslip.month.toUpperCase()} ${payslip.year}`, MARGIN + CONTENT_W * 0.67, 48, {
      width: CONTENT_W * 0.33,
      align: 'right',
    });

  if (payslip.annualCTC > 0) {
    doc
      .font(fontBold)
      .fontSize(8)
      .fillColor(COLORS.sage)
      .text(`ANNUAL CTC: ${formatINR(payslip.annualCTC)}`, MARGIN + CONTENT_W * 0.67, 60, {
        width: CONTENT_W * 0.33,
        align: 'right',
      });
  }

  doc
    .font(fontRegular)
    .fontSize(8)
    .fillColor(COLORS.primaryText)
    .text(`Pay Date: ${payslip.payDate}`, MARGIN + CONTENT_W * 0.67, 72, {
      width: CONTENT_W * 0.33,
      align: 'right',
    });

  // ── EMPLOYEE INFO SECTION — Sage background, dark green text ───────────
  let y = 120;
  doc.rect(MARGIN, y, CONTENT_W, 105).fill(COLORS.sage);
  doc.font(fontBold).fontSize(9).fillColor(COLORS.primary).text('EMPLOYEE DETAILS', MARGIN + 10, y + 8);
  doc.rect(MARGIN + 10, y + 19, 100, 1.5).fill(COLORS.primary);
  y += 28;

  const empFields = [
    ['Employee Name', payslip.employeeName],
    ['Employee ID', payslip.employeeId],
    ['Designation', payslip.designation],
    ['Department', payslip.department],
    ['Date of Joining', payslip.dateOfJoining || '—'],
    ['PAN Number', payslip.panNumber || '—'],
    ['PF Number', payslip.pfNumber || '—'],
    ['Bank Account', payslip.bankAccount ? `****${payslip.bankAccount.slice(-4)}` : '—'],
  ];

  const halfFields = Math.ceil(empFields.length / 2);
  const colW = CONTENT_W / 2;

  empFields.forEach((field, i) => {
    const col = i < halfFields ? 0 : 1;
    const row = i < halfFields ? i : i - halfFields;
    const fx = MARGIN + col * colW + 10;
    const fy = y + row * 17;

    // Label in muted gray, value in dark green text (green on sage background)
    doc.font(fontRegular).fontSize(8).fillColor(COLORS.gray).text(field[0] + ':', fx, fy, { width: 90 });
    doc.font(fontBold).fontSize(8.5).fillColor(COLORS.sageText).text(field[1], fx + 95, fy, { width: colW - 115 });
  });

  // ── WORKING DAYS ─────────────────────────────────────────────────────────
  y += halfFields * 17 + 14;
  const daysBoxW = (CONTENT_W - 20) / 3;
  const daysData = [
    ['Working Days', payslip.workingDays],
    ['Paid Days', payslip.paidDays],
    ['Loss of Pay', payslip.workingDays - payslip.paidDays],
  ];

  daysData.forEach((item, i) => {
    const bx = MARGIN + i * (daysBoxW + 10);
    // First box: forest green bg. Other boxes: sage bg.
    const boxBg = i === 0 ? COLORS.primary : COLORS.sage;
    doc.rect(bx, y, daysBoxW, 30).fill(boxBg);
    doc
      .font(fontRegular)
      .fontSize(7.5)
      .fillColor(i === 0 ? COLORS.sage : COLORS.gray)
      .text(item[0], bx + 8, y + 5, { width: daysBoxW - 16 });
    doc
      .font(fontBold)
      .fontSize(13)
      .fillColor(i === 0 ? COLORS.white : COLORS.primary)
      .text(String(item[1]), bx + 8, y + 14, { width: daysBoxW - 16 });
  });

  // ── EARNINGS & DEDUCTIONS TABLE ───────────────────────────────────────────
  y += 44;
  const tableW = CONTENT_W;
  const COL = {
    earning: MARGIN, earningAmt: MARGIN + tableW * 0.32,
    deduction: MARGIN + tableW * 0.5, deductionAmt: MARGIN + tableW * 0.82,
  };

  // Table header — forest green bg, sage text
  doc.rect(MARGIN, y, tableW, 22).fill(COLORS.primary);
  doc
    .font(fontBold).fontSize(9).fillColor(COLORS.sage)
    .text('EARNINGS', COL.earning + 10, y + 7)
    .text('AMOUNT (Rs.)', COL.earningAmt, y + 7, { width: 80, align: 'right' })
    .text('DEDUCTIONS', COL.deduction + 10, y + 7)
    .text('AMOUNT (Rs.)', COL.deductionAmt, y + 7, { width: 80, align: 'right' });

  doc.moveTo(MARGIN + tableW * 0.5, y).lineTo(MARGIN + tableW * 0.5, y + 22).strokeColor(COLORS.sage).lineWidth(0.5).stroke();
  y += 22;

  const earnings = payslip.employmentType === 'intern' 
    ? [['Monthly Stipend', payslip.stipend || payslip.grossEarnings]]
    : [
        ['Basic Salary (50%)', payslip.basicSalary],
        ['House Rent Allowance (40%)', payslip.hra],
        ['Special Allowance', payslip.specialAllowance],
        ['Employer PF Contribution', payslip.employerPF],
      ];

  if (payslip.otherEarnings > 0) earnings.push([payslip.otherEarningsLabel || 'Other Earnings', payslip.otherEarnings]);

  const deductions = [
    ['Employee PF', payslip.providentFund],
    ['ESI', payslip.esi],
    ['Professional Tax', payslip.professionalTax],
    ['Tax Deducted (TDS)', payslip.tds],
    ['Loan Deduction', payslip.loanDeduction],
    [payslip.otherDeductionsLabel || 'Other Deductions', payslip.otherDeductions],
  ].filter((d) => d[1] > 0);

  const maxRows = Math.max(earnings.length, deductions.length, 4);
  const ROW_H = 18;

  for (let i = 0; i < maxRows; i++) {
    // Alternate: sage (#e5ebdd) and white (#ffffff)
    const rowBg = i % 2 === 0 ? COLORS.sage : COLORS.white;
    doc.rect(MARGIN, y, tableW, ROW_H).fill(rowBg);
    doc.moveTo(MARGIN + tableW * 0.5, y).lineTo(MARGIN + tableW * 0.5, y + ROW_H).strokeColor(COLORS.lightGray).lineWidth(0.3).stroke();

    if (earnings[i]) {
      // Label: dark text, amount: green text on row background
      doc.font(fontRegular).fontSize(8.5).fillColor(COLORS.darkGray).text(earnings[i][0], COL.earning + 10, y + 5);
      doc.font(fontBold).fontSize(8.5).fillColor(COLORS.earningGreen).text(formatINR(earnings[i][1]), COL.earningAmt, y + 5, { width: 80, align: 'right' });
    }
    if (deductions[i]) {
      doc.font(fontRegular).fontSize(8.5).fillColor(COLORS.darkGray).text(deductions[i][0], COL.deduction + 10, y + 5);
      doc.font(fontBold).fontSize(8.5).fillColor(COLORS.deductionRed).text(formatINR(deductions[i][1]), COL.deductionAmt, y + 5, { width: 80, align: 'right' });
    }
    y += ROW_H;
  }

  // Totals row — sage background, green text (secondary treatment)
  doc.rect(MARGIN, y, tableW, 22).fill(COLORS.sage);
  doc.moveTo(MARGIN + tableW * 0.5, y).lineTo(MARGIN + tableW * 0.5, y + 22).strokeColor(COLORS.primary).lineWidth(0.5).stroke();
  doc
    .font(fontBold).fontSize(9).fillColor(COLORS.primary)
    .text('GROSS EARNINGS', COL.earning + 10, y + 7)
    .text(formatINR(payslip.grossEarnings), COL.earningAmt, y + 7, { width: 80, align: 'right' })
    .text('TOTAL DEDUCTIONS', COL.deduction + 10, y + 7)
    .text(formatINR(payslip.totalDeductions), COL.deductionAmt, y + 7, { width: 80, align: 'right' });

  y += 30;

  // ── NET SALARY/STIPEND BAND — Forest Green bg, sage label, white amount ─────────
  doc.rect(MARGIN, y, tableW, 48).fill(COLORS.primary);
  doc.rect(MARGIN, y, 4, 48).fill(COLORS.sage);
  doc.font(fontBold).fontSize(11).fillColor(COLORS.sage).text(payslip.employmentType === 'intern' ? 'NET STIPEND PAYABLE' : 'NET SALARY PAYABLE', MARGIN + 16, y + 8);
  doc
    .font(fontBold).fontSize(18).fillColor(COLORS.white)
    .text(formatINR(payslip.netSalary), MARGIN + CONTENT_W * 0.45, y + 14, { width: CONTENT_W * 0.5, align: 'right' });
  doc
    .font(fontRegular).fontSize(8).fillColor(COLORS.sage)
    .text('(' + numberToWords(payslip.netSalary) + ')', MARGIN + 16, y + 30, { width: CONTENT_W - 20 });

  // Notes — green label, gray text
  if (payslip.notes) {
    y += 58;
    doc.font(fontBold).fontSize(8).fillColor(COLORS.primary).text('Notes:', MARGIN, y);
    doc.font(fontRegular).fontSize(8).fillColor(COLORS.gray).text(payslip.notes, MARGIN + 40, y, { width: CONTENT_W - 40 });
  }

  // Signature
  y = PAGE_H - 100;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + 130, y).strokeColor(COLORS.lightGray).lineWidth(1).stroke();
  doc.moveTo(PAGE_W - MARGIN - 130, y).lineTo(PAGE_W - MARGIN, y).stroke();
  doc
    .font(fontRegular).fontSize(8).fillColor(COLORS.gray)
    .text("Employee's Signature", MARGIN, y + 5, { width: 130, align: 'center' })
    .text("Authorized Signatory", PAGE_W - MARGIN - 130, y + 5, { width: 130, align: 'center' });

  // Footer — forest green bg, sage top line, white text
  doc.rect(0, PAGE_H - 32, PAGE_W, 32).fill(COLORS.primary);
  doc.rect(0, PAGE_H - 32, PAGE_W, 2).fill(COLORS.sage);
  doc
    .font(fontRegular).fontSize(7.5).fillColor(COLORS.sage)
    .text('This is a computer-generated payslip and does not require a physical signature.  |  ' + payslip.companyName, 0, PAGE_H - 22, { width: PAGE_W, align: 'center' });

  // IMPORTANT: Ensure the document stream is closed
  doc.end();
}

/**
 * Generate a payslip PDF and pipe it to the response
 */
function generatePayslipPDF(payslip, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: `Payslip - ${payslip.employeeName} - ${payslip.month} ${payslip.year}`,
      Author: payslip.companyName,
      Subject: 'Payslip',
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Payslip_${payslip.employeeName.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.pdf"`
  );

  doc.pipe(res);
  try {
    drawPayslip(doc, payslip);
  } catch (err) {
    console.error('CRITICAL: PDF drawing error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Critical error during PDF generation', details: err.message });
    }
  }
}

/**
 * Main PDF drawing function (Internal & Exported)
 */
module.exports = { 
  generatePayslipPDF,
  drawPayslip 
};
