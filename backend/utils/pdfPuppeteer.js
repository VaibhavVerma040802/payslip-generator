const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { generatePayslipHTML } = require('./payslipHTML');
const fs = require('fs');

/**
 * Find local chrome executable for development
 */
function getLocalChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Generates a high-fidelity PDF buffer using Puppeteer (Serverless Compatible)
 * @param {Object} payslip - Payslip document from MongoDB
 * @returns {Promise<Buffer>} PDF Buffer
 */
async function generatePDFBuffer(payslip) {
  let browser;
  try {
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    
    const options = isVercel ? {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    } : {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: getLocalChromePath(),
      headless: true
    };

    // Launch browser
    browser = await puppeteer.launch(options);

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
    throw new Error(`Failed to generate PDF: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generatePDFBuffer };
