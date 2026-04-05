/**
 * Email Service
 *
 * Sends emails using SendGrid Web API or Nodemailer SMTP.
 * SendGrid API is preferred for cloud platforms (avoids SMTP port blocking).
 */

const nodemailer = require('nodemailer');

// Try to import SendGrid - it's optional fallback
let sgMail = null;
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  console.log('[Email] SendGrid package not installed, using SMTP only');
}

/**
 * Check if credentials are SendGrid API key
 * SendGrid keys start with "SG."
 */
const isSendGridAPIKey = (pass) => {
  return pass && pass.startsWith('SG.');
};

/**
 * Send email using SendGrid Web API
 * Uses HTTP instead of SMTP (bypasses port blocking)
 */
const sendWithSendGrid = async (to, otp, name) => {
  if (!sgMail) {
    throw new Error('SendGrid package not available');
  }

  // Set API key
  sgMail.setApiKey(process.env.SMTP_PASS);

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER,
      name: process.env.APP_NAME || 'SeedLing',
    },
    subject: 'Verify Your Email - SeedLing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #0284c7; margin-bottom: 20px; text-align: center;">Verify Your Email</h2>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${name},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for signing up with SeedLing! To complete your registration, please use the verification code below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #0284c7, #38bdf8); color: white; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
            This code will expire in <strong>10 minutes</strong>.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            If you didn't request this, please ignore this email.<br>
            SeedLing - Crowdfunding Made Simple
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nSeedLing - Crowdfunding Made Simple`,
  };

  // Send with timeout
  const sendPromise = sgMail.send(msg);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('SendGrid request timeout')), 10000)
  );

  await Promise.race([sendPromise, timeoutPromise]);
  return true;
};

/**
 * Send email using SMTP (Nodemailer)
 */
const sendWithSMTP = async (to, otp, name) => {
  const isGmail = (process.env.SMTP_HOST || '').includes('gmail');
  const isSendGridSMTP = (process.env.SMTP_HOST || '').includes('sendgrid');

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Add connection timeout
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 5000,
  };

  if (isGmail) {
    console.log('[Email] Using Gmail SMTP');
  } else if (isSendGridSMTP) {
    console.log('[Email] Using SendGrid SMTP (may be blocked on some platforms)');
  }

  const transporter = nodemailer.createTransport(config);

  // Test connection with timeout
  await transporter.verify();

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'SeedLing'}" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify Your Email - SeedLing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #0284c7; margin-bottom: 20px; text-align: center;">Verify Your Email</h2>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${name},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for signing up with SeedLing! To complete your registration, please use the verification code below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #0284c7, #38bdf8); color: white; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
            This code will expire in <strong>10 minutes</strong>.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            If you didn't request this, please ignore this email.<br>
            SeedLing - Crowdfunding Made Simple
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nSeedLing - Crowdfunding Made Simple`,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

/**
 * Send OTP verification email
 * Automatically chooses best method: SendGrid API > SMTP
 */
const sendOTPEmail = async (to, otp, name) => {
  // Development mode: If no email config, log to console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`
========================================
📧 EMAIL VERIFICATION (DEVELOPMENT MODE)
========================================
To: ${to}
Name: ${name}
OTP: ${otp}
========================================
`);
    return true;
  }

  // Try SendGrid API first (recommended for cloud platforms)
  if (isSendGridAPIKey(process.env.SMTP_PASS)) {
    console.log('[Email] Detected SendGrid API key, using Web API...');
    try {
      await sendWithSendGrid(to, otp, name);
      console.log(`✅ SendGrid API email sent to ${to}`);
      return true;
    } catch (error) {
      console.log('[Email] SendGrid API failed:', error.message);
      console.log('[Email] Falling back to SMTP...');
      // Continue to SMTP fallback
    }
  }

  // Try SMTP (with timeout handling)
  try {
    console.log('[Email] Attempting SMTP...');
    await sendWithSMTP(to, otp, name);
    console.log(`✅ SMTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ SMTP failed:', error.message);
    console.error('   Code:', error.code);
    return false;
  }
};

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendOTPEmail,
  generateOTP,
};
