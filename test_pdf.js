const { drawPayslip } = require('./backend/utils/pdfGenerator');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const mockPayslip = {
  employeeName: 'John Doe',
  employeeId: 'EMP001',
  designation: 'Engineer',
  department: 'IT',
  month: 'April',
  year: '2026',
  payDate: '2026-04-05',
  workingDays: 30,
  paidDays: 30,
  basicSalary: 50000,
  hra: 20000,
  specialAllowance: 10000,
  employerPF: 1800,
  grossEarnings: 81800,
  providentFund: 1800,
  esi: 0,
  professionalTax: 200,
  tds: 5000,
  loanDeduction: 0,
  otherDeductions: 0,
  totalDeductions: 7000,
  netSalary: 74800,
  companyName: 'BDA Technologies',
  companyAddress: '123 Tech Park, Bangalore',
  companyEmail: 'hr@bdatechnologies.com',
  companyLogo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+cpXYAAAAASUVORK5CYII=' // Valid 1x1 black pixel base64
};

try {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const writeStream = fs.createWriteStream('./test_payslip_root.pdf');
  doc.pipe(writeStream);
  
  console.log('Starting drawPayslip...');
  drawPayslip(doc, mockPayslip);
  
  writeStream.on('finish', () => {
    console.log('SUCCESS: PDF generated successfully at ./test_payslip_root.pdf');
    process.exit(0);
  });
  
  writeStream.on('error', (err) => {
    console.error('WriteStream Error:', err);
    process.exit(1);
  });

} catch (err) {
  console.error('CRITICAL: PDF Generation Crash:', err);
  process.exit(1);
}
