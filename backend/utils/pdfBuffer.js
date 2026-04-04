const PDFDocument = require('pdfkit');
const generator = require('./pdfGenerator');
const { drawPayslip } = generator;

console.log('PDF Generator Keys:', Object.keys(generator));
console.log('drawPayslip type:', typeof drawPayslip);

/**
 * Generates payslip PDF as a Buffer (for email attachments)
 * Uses the SAME unified drawing logic as direct downloads.
 * Hardened with error resilience for serverless environments.
 */
function generatePayslipPDFBuffer(payslip) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `Payslip - ${payslip.employeeName} - ${payslip.month} ${payslip.year}`,
          Author: payslip.companyName,
          Subject: 'Salary Slip',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });
      doc.on('end', () => {
        const finalBuffer = Buffer.concat(chunks);
        console.log(`📑 PDF Generation Complete. Buffer Size: ${finalBuffer.length} bytes`);
        resolve(finalBuffer);
      });
      doc.on('error', (err) => {
        console.error('❌ PDF Kit Internal Error:', err);
        reject(err);
      });

      // Execute unified drawing logic
      console.log('🎨 Starting PDF Drawing Engine...');
      drawPayslip(doc, payslip);
      console.log('🏁 PDF Drawing Instructions Sent to Stream');
    } catch (err) {
      console.error('CRITICAL: PDF Buffer Generation Exception:', err);
      reject(err);
    }
  });
}

module.exports = { generatePayslipPDFBuffer };
