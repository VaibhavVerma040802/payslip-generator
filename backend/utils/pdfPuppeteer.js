const puppeteer = require('puppeteer');
const { generatePayslipHTML } = require('./payslipHTML');

/**
 * Generates a high-fidelity PDF buffer using Puppeteer
 * @param {Object} payslip - Payslip document from MongoDB
 * @returns {Promise<Buffer>} PDF Buffer
 */
async function generatePDFBuffer(payslip) {
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content from our HTML template
    const html = generatePayslipHTML(payslip);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    return pdfBuffer;
  } catch (err) {
    console.error('Puppeteer PDF Error:', err);
    throw new Error('Failed to generate PDF via Puppeteer');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generatePDFBuffer };
