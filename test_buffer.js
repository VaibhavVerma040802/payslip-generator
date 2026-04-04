const { generatePayslipPDFBuffer } = require('./backend/utils/pdfBuffer');
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
  companyLogo: ''
};

async function testBuffer() {
  try {
    console.log('Generating PDF Buffer...');
    const buffer = await generatePayslipPDFBuffer(mockPayslip);
    console.log('SUCCESS: Buffer generated, length:', buffer.length);
    fs.writeFileSync('test_buffer.pdf', buffer);
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL: Buffer Test Failed:', err);
    process.exit(1);
  }
}

testBuffer();
