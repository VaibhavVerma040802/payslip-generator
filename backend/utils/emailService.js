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
  console.log(`✉️ Initializing delivery for: ${payslip.employeeEmail}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials missing. Please set EMAIL_USER and EMAIL_PASS in Vercel Dashboard.');
  }

  // Generate PDF as buffer
  const pdfBuffer = await generatePayslipPDFBuffer(payslip);
  
  if (!pdfBuffer || pdfBuffer.length < 100) {
    throw new Error('PDF Attachment generation failed or produced a corrupted file.');
  }

  // Use explicit SMTP configuration for better production reliability
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: (process.env.EMAIL_USER || '').trim(),
      pass: (process.env.EMAIL_PASS || '').trim(),
    },
    debug: false,
    logger: false 
  });

  // Verify connection before attempting to send
  try {
    console.log('🔌 Verifying SMTP Connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection State: Valid');
  } catch (verifyErr) {
    console.error('❌ SMTP Auth Failure:', verifyErr.message);
    throw new Error(`SMTP Delivery Failed: ${verifyErr.message}. Verify that you are using a 16-character APP PASSWORD, not your standard Google password.`);
  }

  const fileName = `Payslip_${payslip.employeeName.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.pdf`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: payslip.employeeEmail,
    subject: `Monthly Payslip - ${payslip.month} ${payslip.year} — ${payslip.companyName}`,
    html: buildEmailHTML(payslip),
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  console.log('🚀 Sending mail...');
  const result = await transporter.sendMail(mailOptions);
  console.log(`✅ Transmission Success: ${result.messageId}`);
  return result;
}

/**
 * Build a clean HTML email body using table-based layout for maximum compatibility.
 */
function buildEmailHTML(payslip) {
  const formatINR = (n) =>
    '₹ ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const navy = '#1e3a5f';
  const gold = '#c9a84c';

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payslip - ${payslip.employeeName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6fa; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Wrapper -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <!-- Top Accent Bar -->
          <tr><td height="6" bgcolor="${gold}" style="font-size: 0; line-height: 0;">&nbsp;</td></tr>
          
          <!-- Header -->
          <tr>
            <td bgcolor="${navy}" style="padding: 40px 45px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${payslip.companyName.toUpperCase()}</h1>
                    <p style="margin: 6px 0 0 0; color: #aac4e0; font-size: 14px; font-weight: 500;">Salary Slip for ${payslip.month} ${payslip.year}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 45px;">
              <p style="margin: 0 0 20px 0; color: #1e3a5f; font-size: 18px; font-weight: 700;">Dear ${payslip.employeeName},</p>
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">Your payslip for <strong>${payslip.month} ${payslip.year}</strong> has been generated. Please find the detailed PDF attached to this email for your records.</p>
              
              <!-- Stats Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 10px; border-left: 5px solid ${navy}; border-collapse: separate;">
                <tr>
                  <td style="padding: 25px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; padding-bottom: 8px;">Employee ID</td>
                        <td align="right" style="font-size: 13px; color: #1e3a5f; font-weight: 700; padding-bottom: 8px;">${payslip.employeeId}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; padding-bottom: 8px;">Designation</td>
                        <td align="right" style="font-size: 13px; color: #1e3a5f; font-weight: 700; padding-bottom: 8px;">${payslip.designation}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; padding-bottom: 8px;">Gross Earnings</td>
                        <td align="right" style="font-size: 13px; color: #059669; font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 12px; padding-bottom: 8px;">${formatINR(payslip.grossEarnings)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; padding-bottom: 12px;">Total Deductions</td>
                        <td align="right" style="font-size: 13px; color: #dc2626; font-weight: 700; padding-bottom: 12px;">${formatINR(payslip.totalDeductions)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Net Salary Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 25px; background-color: ${navy}; border-radius: 10px; text-align: center;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0; color: #aac4e0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Net Salary Payable</p>
                    <h2 style="margin: 8px 0 0 0; color: #c9a84c; font-size: 32px; font-weight: 800;">${formatINR(payslip.netSalary)}</h2>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <strong>Note:</strong> This is a computer-generated summary. Please refer to the attached PDF for full statutory breakdown.<br />
                For any queries, please contact <a href="mailto:${payslip.companyEmail || ''}" style="color: ${navy}; text-decoration: none; font-weight: 600;">${payslip.companyEmail || 'HR Department'}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f9fafb" style="padding: 25px 45px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">&copy; 2026 PaySlip Pro. All rights reserved. Professional Payroll Management.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = { sendPayslipEmail, sendVerificationEmail };
