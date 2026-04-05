/**
 * Test Email Script
 * Run this to diagnose email issues on Render
 * Usage: node scripts/test-email.js
 */

const nodemailer = require('nodemailer');

console.log('🔍 Testing Email Configuration...\n');

// Log all env vars (safely)
console.log('Environment Variables:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('  SMTP_SECURE:', process.env.SMTP_SECURE || 'NOT SET');
console.log('  SMTP_USER:', process.env.SMTP_USER ? 'Set (hidden)' : 'NOT SET');
console.log('  SMTP_PASS:', process.env.SMTP_PASS ? `Set (length: ${process.env.SMTP_PASS.length})` : 'NOT SET');
console.log('  APP_NAME:', process.env.APP_NAME || 'SeedLing');
console.log('');

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ ERROR: SMTP_USER and SMTP_PASS must be set');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
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
});

console.log('🔌 Testing SMTP Connection...');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    if (error.response) {
      console.error('  Server Response:', error.response);
    }
    console.log('\n📚 Common Fixes:');
    console.log('  1. Gmail: Use 16-char App Password (not regular password)');
    console.log('  2. Gmail: Enable 2-Step Verification first');
    console.log('  3. Render: Check env vars are set in dashboard');
    console.log('  4. Try SendGrid instead of Gmail (see README)');
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');
    console.log('📧 Sending test email...');

    const testMail = {
      from: `"${process.env.APP_NAME || 'Test'}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Email from SeedLing',
      text: 'This is a test email to verify SMTP configuration.',
    };

    transporter.sendMail(testMail, (err, info) => {
      if (err) {
        console.error('❌ Failed to send test email:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('  Message ID:', info.messageId);
        console.log('  Check your inbox:', process.env.SMTP_USER);
        process.exit(0);
      }
    });
  }
});
