/**
 * Email Service
 *
 * Sends emails using Nodemailer for OTP verification.
 * Supports SMTP configuration via environment variables.
 */

const nodemailer = require('nodemailer');

// Create transporter using environment variables
const createTransporter = () => {
  const isGmail = (process.env.SMTP_HOST || '').includes('gmail');

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Add TLS options for cloud platforms like Render
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs (needed on some cloud platforms)
    },
  };

  // Gmail-specific settings
  if (isGmail) {
    console.log('[Email] Using Gmail SMTP with TLS settings');
  }

  return nodemailer.createTransport(config);
};

/**
 * Send OTP verification email
 * @param {string} to - Recipient email address
 * @param {string} otp - The OTP code
 * @param {string} name - User's name
 */
const sendOTPEmail = async (to, otp, name) => {
  // Development mode: If SMTP is not configured, log to console and return success
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

    // In development, you can still use this OTP to verify
    return true;
  }

  try {
    const transporter = createTransporter();

    // Test connection first
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

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
    console.log(`OTP email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error stack:', error.stack);
    // Log full error response if available (from SMTP server)
    if (error.response) {
      console.error('   SMTP Response:', error.response);
    }
    if (error.responseCode) {
      console.error('   SMTP Response Code:', error.responseCode);
    }
    if (error.command) {
      console.error('   Failed Command:', error.command);
    }
    console.error('   SMTP_HOST:', process.env.SMTP_HOST);
    console.error('   SMTP_PORT:', process.env.SMTP_PORT);
    console.error('   SMTP_SECURE:', process.env.SMTP_SECURE);
    console.error('   SMTP_USER:', process.env.SMTP_USER ? 'Set (hidden)' : 'NOT SET');
    console.error('   SMTP_PASS:', process.env.SMTP_PASS ? 'Set (length: ' + (process.env.SMTP_PASS?.length || 0) + ')' : 'NOT SET');
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
