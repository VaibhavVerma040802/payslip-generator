const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Reusing the same layout logic as pdfGenerator.js but returns a Buffer
const COLORS = {
  navy: '#1e3a5f',
  gold: '#c9a84c',
  lightGold: '#f0d98a',
  white: '#ffffff',
  offWhite: '#f8f9fa',
  gray: '#6b7280',
  lightGray: '#e5e7eb',
  darkGray: '#374151',
  tableRow1: '#f8f9fa',
  tableRow2: '#ffffff',
};

function formatINR(amount) {
  const num = parseFloat(amount) || 0;
  return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numberToWords(num) {
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
}

/**
 * Generates payslip PDF as a Buffer (for email attachments)
 */
function generatePayslipPDFBuffer(payslip) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 40;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // Header
    doc.rect(0, 0, PAGE_W, 110).fill(COLORS.navy);
    doc.rect(0, 0, PAGE_W, 4).fill(COLORS.gold);

    // Logo (if exists)
    const logoPath = path.join(__dirname, '../assets/logo.png');
    let hasLogo = false;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, MARGIN, 24, { height: 45 });
        hasLogo = true;
      } catch (e) {
        console.error('Error loading logo:', e);
      }
    }

    const textX = hasLogo ? MARGIN + 60 : MARGIN;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.white).text(payslip.companyName.toUpperCase(), textX, 28, { width: CONTENT_W * 0.55 });
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGold).text(payslip.companyAddress, textX, 50, { width: CONTENT_W * 0.55 });
    if (payslip.companyEmail) {
      doc.text(payslip.companyEmail + (payslip.companyPhone ? '  |  ' + payslip.companyPhone : ''), textX, 62, { width: CONTENT_W * 0.55 });
    }
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.gold).text('SALARY SLIP', MARGIN + CONTENT_W * 0.67, 28, { width: CONTENT_W * 0.33, align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.lightGold).text(`${payslip.month.toUpperCase()} ${payslip.year}`, MARGIN + CONTENT_W * 0.67, 48, { width: CONTENT_W * 0.33, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor('#aac4e0').text(`Pay Date: ${payslip.payDate}`, MARGIN + CONTENT_W * 0.67, 63, { width: CONTENT_W * 0.33, align: 'right' });

    // Employee Info
    let y = 120;
    doc.rect(MARGIN, y, CONTENT_W, 105).fill(COLORS.offWhite).stroke(COLORS.lightGray);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.navy).text('EMPLOYEE DETAILS', MARGIN + 10, y + 8);
    doc.rect(MARGIN + 10, y + 19, 100, 1.5).fill(COLORS.gold);
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
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray).text(field[0] + ':', fx, fy, { width: 90 });
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.darkGray).text(field[1], fx + 95, fy, { width: colW - 115 });
    });

    y += halfFields * 17 + 14;

    // Days boxes
    const daysBoxW = (CONTENT_W - 20) / 3;
    const daysData = [['Working Days', payslip.workingDays], ['Paid Days', payslip.paidDays], ['Loss of Pay', payslip.workingDays - payslip.paidDays]];
    daysData.forEach((item, i) => {
      const bx = MARGIN + i * (daysBoxW + 10);
      doc.rect(bx, y, daysBoxW, 30).fill(i === 0 ? COLORS.navy : COLORS.offWhite).stroke(COLORS.lightGray);
      doc.font('Helvetica').fontSize(7.5).fillColor(i === 0 ? COLORS.lightGold : COLORS.gray).text(item[0], bx + 8, y + 5, { width: daysBoxW - 16 });
      doc.font('Helvetica-Bold').fontSize(13).fillColor(i === 0 ? COLORS.white : COLORS.navy).text(String(item[1]), bx + 8, y + 14, { width: daysBoxW - 16 });
    });

    y += 44;

    // Table
    const tableW = CONTENT_W;
    const COL = { earning: MARGIN, earningAmt: MARGIN + tableW * 0.32, deduction: MARGIN + tableW * 0.5, deductionAmt: MARGIN + tableW * 0.82 };

    doc.rect(MARGIN, y, tableW, 22).fill(COLORS.navy);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.gold)
      .text('EARNINGS', COL.earning + 10, y + 7)
      .text('AMOUNT (₹)', COL.earningAmt, y + 7, { width: 80, align: 'right' })
      .text('DEDUCTIONS', COL.deduction + 10, y + 7)
      .text('AMOUNT (₹)', COL.deductionAmt, y + 7, { width: 80, align: 'right' });
    doc.moveTo(MARGIN + tableW * 0.5, y).lineTo(MARGIN + tableW * 0.5, y + 22).strokeColor(COLORS.gold).lineWidth(0.5).stroke();

    y += 22;

    const earnings = [
      ['Basic Salary', payslip.basicSalary],
      ['House Rent Allowance', payslip.hra],
      ['Conveyance Allowance', payslip.conveyanceAllowance],
      ['Medical Allowance', payslip.medicalAllowance],
      ['Special Allowance', payslip.specialAllowance],
      [payslip.otherEarningsLabel || 'Other Earnings', payslip.otherEarnings],
    ].filter((e) => e[1] > 0);

    const deductions = [
      ['Provident Fund (PF)', payslip.providentFund],
      ['ESI', payslip.esi],
      ['Tax Deducted (TDS)', payslip.tds],
      ['Professional Tax', payslip.professionalTax],
      ['Loan Deduction', payslip.loanDeduction],
      [payslip.otherDeductionsLabel || 'Other Deductions', payslip.otherDeductions],
    ].filter((d) => d[1] > 0);

    const maxRows = Math.max(earnings.length, deductions.length, 4);
    const ROW_H = 18;

    for (let i = 0; i < maxRows; i++) {
      const rowBg = i % 2 === 0 ? COLORS.tableRow1 : COLORS.tableRow2;
      doc.rect(MARGIN, y, tableW, ROW_H).fill(rowBg);
      doc.moveTo(MARGIN + tableW * 0.5, y).lineTo(MARGIN + tableW * 0.5, y + ROW_H).strokeColor(COLORS.lightGray).lineWidth(0.3).stroke();
      if (earnings[i]) {
        doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.darkGray).text(earnings[i][0], COL.earning + 10, y + 5);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#065f46').text(formatINR(earnings[i][1]), COL.earningAmt, y + 5, { width: 80, align: 'right' });
      }
      if (deductions[i]) {
        doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.darkGray).text(deductions[i][0], COL.deduction + 10, y + 5);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#7f1d1d').text(formatINR(deductions[i][1]), COL.deductionAmt, y + 5, { width: 80, align: 'right' });
      }
      y += ROW_H;
    }

    doc.rect(MARGIN, y, tableW, 22).fill('#e8f0fe');
    doc.moveTo(MARGIN + tableW * 0.5, y).lineTo(MARGIN + tableW * 0.5, y + 22).strokeColor(COLORS.lightGray).lineWidth(0.5).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.navy)
      .text('GROSS EARNINGS', COL.earning + 10, y + 7)
      .text(formatINR(payslip.grossEarnings), COL.earningAmt, y + 7, { width: 80, align: 'right' })
      .text('TOTAL DEDUCTIONS', COL.deduction + 10, y + 7)
      .text(formatINR(payslip.totalDeductions), COL.deductionAmt, y + 7, { width: 80, align: 'right' });

    y += 30;

    // Net Salary band
    doc.rect(MARGIN, y, tableW, 48).fill(COLORS.navy);
    doc.rect(MARGIN, y, 4, 48).fill(COLORS.gold);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.gold).text('NET SALARY PAYABLE', MARGIN + 16, y + 8);
    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.white).text(formatINR(payslip.netSalary), MARGIN + CONTENT_W * 0.5, y + 10, { width: CONTENT_W * 0.48, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor('#aac4e0').text('(' + numberToWords(payslip.netSalary) + ')', MARGIN + 16, y + 30, { width: CONTENT_W - 20 });

    // Footer
    doc.rect(0, PAGE_H - 32, PAGE_W, 32).fill(COLORS.navy);
    doc.rect(0, PAGE_H - 32, PAGE_W, 2).fill(COLORS.gold);
    doc.font('Helvetica').fontSize(7.5).fillColor('#aac4e0').text(
      'This is a computer-generated payslip and does not require a physical signature.  |  ' + payslip.companyName,
      0, PAGE_H - 22, { width: PAGE_W, align: 'center' }
    );

    doc.end();
  });
}

module.exports = { generatePayslipPDFBuffer };
