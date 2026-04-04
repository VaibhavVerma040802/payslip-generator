const PDFDocument = require('pdfkit');
const { drawPayslip } = require('./pdfGenerator');

/**
 * Generates payslip PDF as a Buffer (for email attachments)
 * Uses the SAME unified drawing logic as direct downloads.
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
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => {
        console.error('PDF Buffer Stream Error:', err);
        reject(err);
      });

      // Execute unified drawing logic
      drawPayslip(doc, payslip);
    } catch (err) {
      console.error('PDF Buffer Generation Exception:', err);
      reject(err);
    }
  });
}

module.exports = { generatePayslipPDFBuffer };
