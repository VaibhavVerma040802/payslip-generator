const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { generatePayslipPDFBuffer } = require('./pdfBuffer');

/**
 * Create a reusable Nodemailer transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send welcome email with verification link
 */
async function sendVerificationEmail(user, token, origin) {
  const finalAppUrl = origin || 'https://payslip-generator-itv8zzdtv-vaibhavverma040802s-projects.vercel.app';
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email Verification Skipped: Missing EMAIL_USER or EMAIL_PASS');
    return;
  }

  const transporter = createTransporter();
  // Focus new generation links specifically towards the frontend verify route
  // In development, origin will be http://localhost:3000. On prod, it's the vercel URL.
  const verifyUrl = `${finalAppUrl}/verify?token=${token}`;
  
  console.log(`✉️ Attempting to send verification email to: ${user.email}`);

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: user.email,
    subject: `Verify Your PaySlip Pro Account — ${user.companyName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fa; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .gold-bar { height: 6px; background: #c9a84c; }
    .header { background: #1e3a5f; padding: 40px 45px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header h1 span { color: #c9a84c; }
    .body { padding: 40px 45px; color: #374151; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #1e3a5f; margin-bottom: 12px; }
    .message { font-size: 15px; color: #4b5563; margin-bottom: 30px; }
    .btn-container { text-align: center; margin: 35px 0; }
    .btn { background: #1e3a5f; color: #ffffff !important; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(30,58,95,0.25); border: 2px solid #c9a84c; transition: all 0.2s; }
    .token-text { background: #f8f9fa; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #6b7280; text-align: center; margin-top: 25px; }
    .footer { background: #f9fafb; padding: 25px 45px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="gold-bar"></div>
    <div class="header">
      <h1>PaySlip<span>Pro</span></h1>
    </div>
    <div class="body">
      <div class="greeting">Welcome to the future of payroll!</div>
      <div class="message">
        Hi <strong>${user.companyName}</strong>,<br><br>
        Thank you for choosing PaySlip Pro. We're excited to help you streamline your payroll management. To get started and secure your account, please verify your email address by clicking the button below.
      </div>

      <div class="btn-container">
        <a href="${verifyUrl}" class="btn">Verify Account</a>
      </div>

      <div class="message" style="font-size:13px;">
        If the button above doesn't work, you can copy and paste this link into your browser:
        <br><br>
        <a href="${verifyUrl}" style="color:#1e3a5f;">${verifyUrl}</a>
      </div>

      <div class="token-text">
        This link will expire in 24 hours.
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 PaySlip Pro. All rights reserved.</p>
      <p>Professional Payroll Management Simplified.</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent successfully to: ${user.email}`);
    return result;
  } catch (err) {
    console.error(`❌ SMTP Error for ${user.email}:`, err);
    throw err;
  }
}

/**
 * Send payslip as PDF attachment to the employee's email
 * @param {Object} payslip - Payslip document from MongoDB
 * @returns {Promise<Object>} Nodemailer send result
 */
async function sendPayslipEmail(payslip) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env');
  }

  // Generate PDF as buffer
  const pdfBuffer = await generatePayslipPDFBuffer(payslip);

  const transporter = createTransporter();

  const fileName = `Payslip_${payslip.employeeName.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.pdf`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: payslip.employeeEmail,
    subject: `Salary Slip for ${payslip.month} ${payslip.year} — ${payslip.companyName}`,
    html: buildEmailHTML(payslip),
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`✅ Payslip email sent successfully to: ${payslip.employeeEmail}`);
  return result;
}

/**
 * Build a clean HTML email body
 */
function buildEmailHTML(payslip) {
  const formatINR = (n) =>
    '₹ ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fa; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #1e3a5f; padding: 30px 35px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: #aac4e0; margin: 4px 0 0; font-size: 13px; }
    .gold-bar { height: 4px; background: #c9a84c; }
    .body { padding: 30px 35px; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
    .summary { background: #f8f9fa; border-radius: 8px; padding: 18px 22px; margin: 20px 0; border-left: 4px solid #1e3a5f; }
    .summary table { width: 100%; border-collapse: collapse; }
    .summary td { padding: 5px 0; font-size: 13px; color: #374151; }
    .summary td:last-child { text-align: right; font-weight: 600; color: #1e3a5f; }
    .net-salary { background: #1e3a5f; border-radius: 8px; padding: 18px 22px; text-align: center; margin: 22px 0; }
    .net-salary .label { color: #aac4e0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .net-salary .amount { color: #c9a84c; font-size: 28px; font-weight: 700; margin: 4px 0 0; }
    .note { font-size: 12px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 18px; }
    .footer { background: #1e3a5f; padding: 16px 35px; text-align: center; }
    .footer p { color: #aac4e0; font-size: 11px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="gold-bar"></div>
    <div class="header">
      <h1>${payslip.companyName}</h1>
      <p>Salary Slip — ${payslip.month} ${payslip.year}</p>
    </div>
    <div class="body">
      <p class="greeting">Dear <strong>${payslip.employeeName}</strong>,</p>
      <p style="font-size:14px;color:#6b7280;">Please find attached your salary slip for <strong>${payslip.month} ${payslip.year}</strong>. Below is a quick summary:</p>

      <div class="summary">
        <table>
          <tr><td>Employee ID</td><td>${payslip.employeeId}</td></tr>
          <tr><td>Designation</td><td>${payslip.designation}</td></tr>
          <tr><td>Department</td><td>${payslip.department}</td></tr>
          <tr><td>Pay Date</td><td>${payslip.payDate}</td></tr>
          <tr><td>Paid Days</td><td>${payslip.paidDays} / ${payslip.workingDays}</td></tr>
          <tr style="border-top:1px solid #e5e7eb"><td style="padding-top:10px">Gross Earnings</td><td style="padding-top:10px">${formatINR(payslip.grossEarnings)}</td></tr>
          <tr><td>Total Deductions</td><td style="color:#991b1b">${formatINR(payslip.totalDeductions)}</td></tr>
        </table>
      </div>

      <div class="net-salary">
        <div class="label">Net Salary Payable</div>
        <div class="amount">${formatINR(payslip.netSalary)}</div>
      </div>

      <p style="font-size:13px;color:#374151;">The detailed payslip PDF is attached to this email for your records.</p>

      <p class="note">
        This is an auto-generated email. Please do not reply directly to this message.<br>
        For any queries, reach out to HR at <a href="mailto:${payslip.companyEmail || ''}" style="color:#1e3a5f;">${payslip.companyEmail || 'your HR team'}</a>.
      </p>
    </div>
    <div class="footer">
      <p>${payslip.companyName} — Confidential Payroll Document</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { sendPayslipEmail, sendVerificationEmail };
