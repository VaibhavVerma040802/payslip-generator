const { generatePayslipBuffer } = require('./pdfGenerator');

/**
 * Generates payslip PDF as a Buffer (for email attachments).
 * Uses the same Puppeteer-based logic as direct downloads for consistency.
 */
async function generatePayslipPDFBuffer(payslip) {
  try {
    const buffer = await generatePayslipBuffer(payslip);
    return buffer;
  } catch (err) {
    console.error('❌ PDF buffer generation failed:', err.message);
    throw err;
  }
}

module.exports = { generatePayslipPDFBuffer };
