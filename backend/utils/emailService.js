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

/**
 * Send donation thank you email to donor using SendGrid
 */
const sendDonationEmailToDonorSendGrid = async (donorEmail, donorName, amount, campaignTitle) => {
  if (!sgMail) {
    throw new Error('SendGrid package not available');
  }

  sgMail.setApiKey(process.env.SMTP_PASS);

  const msg = {
    to: donorEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER,
      name: process.env.APP_NAME || 'SeedLing',
    },
    subject: 'Thank You for Your Donation! 🌱',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🌱</div>
            <h2 style="color: #0284c7; margin: 0;">Thank You for Your Support!</h2>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${donorName},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for your generous donation to <strong>${campaignTitle}</strong>!
          </p>

          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Your Donation Amount</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</p>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your contribution brings us one step closer to making this campaign a reality. The campaign creator and all the backers truly appreciate your support!
          </p>

          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="color: #065f46; margin: 0; font-size: 14px;">
              <strong>🌿 SeedLing Impact:</strong> Thanks to supporters like you, creative ideas become reality!
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Thanks for using <strong>SeedLing</strong> - Crowdfunding Made Simple
          </p>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Have questions? Reply to this email anytime.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${donorName},\n\nThank you for your generous donation to ${campaignTitle}!\n\nYour Donation Amount: ₹${amount.toLocaleString('en-IN')}\n\nYour contribution brings us one step closer to making this campaign a reality. The campaign creator and all the backers truly appreciate your support!\n\nThanks for using SeedLing - Crowdfunding Made Simple\n\nHave questions? Reply to this email anytime.`,
  };

  const sendPromise = sgMail.send(msg);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('SendGrid request timeout')), 10000)
  );

  await Promise.race([sendPromise, timeoutPromise]);
  return true;
};

/**
 * Send donation thank you email to donor using SMTP
 */
const sendDonationEmailToDonorSMTP = async (donorEmail, donorName, amount, campaignTitle, message) => {
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
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  };

  const transporter = nodemailer.createTransport(config);
  await transporter.verify();

  const messageSection = message ? `
    <div style="background-color: #f3f4f6; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">Your Message</p>
      <p style="color: #374151; margin: 0; font-size: 16px; font-style: italic;">"${message}"</p>
    </div>
  ` : '';

  const messageText = message ? `\nYour Message: "${message}"\n` : '';

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'SeedLing'}" <${process.env.SMTP_USER}>`,
    to: donorEmail,
    subject: 'Thank You for Your Donation! 🌱',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🌱</div>
            <h2 style="color: #0284c7; margin: 0;">Thank You for Your Support!</h2>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${donorName},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for your generous donation to <strong>${campaignTitle}</strong>!
          </p>

          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Your Donation Amount</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</p>
          </div>

          ${messageSection}

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your contribution brings us one step closer to making this campaign a reality. The campaign creator and all the backers truly appreciate your support!
          </p>

          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="color: #065f46; margin: 0; font-size: 14px;">
              <strong>🌿 SeedLing Impact:</strong> Thanks to supporters like you, creative ideas become reality!
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Thanks for using <strong>SeedLing</strong> - Crowdfunding Made Simple
          </p>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Have questions? Reply to this email anytime.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${donorName},\n\nThank you for your generous donation to ${campaignTitle}!\n\nYour Donation Amount: ₹${amount.toLocaleString('en-IN')}${messageText}\nYour contribution brings us one step closer to making this campaign a reality. The campaign creator and all the backers truly appreciate your support!\n\nThanks for using SeedLing - Crowdfunding Made Simple\n\nHave questions? Reply to this email anytime.`,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

/**
 * Send donation notification email to campaign creator using SendGrid
 */
const sendDonationEmailToCreatorSendGrid = async (creatorEmail, creatorName, donorName, amount, campaignTitle, currentAmount, goalAmount, message, anonymous) => {
  if (!sgMail) {
    throw new Error('SendGrid package not available');
  }

  sgMail.setApiKey(process.env.SMTP_PASS);

  const progress = Math.min((currentAmount / goalAmount) * 100, 100).toFixed(1);
  
  // If anonymous, don't show the real donor name
  const displayDonorName = anonymous ? 'Anonymous' : donorName;
  const anonymousBadge = anonymous ? '<span style="background-color: #f3f4f6; color: #6b7280; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin-left: 8px;">🕵️ Anonymous</span>' : '';

  const messageSection = message ? `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #92400e; margin: 0 0 5px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">💌 Message from ${displayDonorName}</p>
      <p style="color: #78350f; margin: 0; font-size: 16px; font-style: italic;">"${message}"</p>
    </div>
  ` : '';

  const messageText = message ? `\n💌 Message from ${displayDonorName}: "${message}"\n` : '';

  const msg = {
    to: creatorEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER,
      name: process.env.APP_NAME || 'SeedLing',
    },
    subject: `🎉 New Donation Received for ${campaignTitle}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
            <h2 style="color: #0284c7; margin: 0;">New Donation Received!</h2>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${creatorName},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Great news! <strong>${displayDonorName}</strong>${anonymousBadge} just donated to your campaign <strong>${campaignTitle}</strong>.
          </p>

          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">New Donation</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</p>
          </div>

          ${messageSection}

          <div style="background-color: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📊 Campaign Progress</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #374151;">Total Raised:</span>
              <span style="color: #1e40af; font-weight: bold;">₹${currentAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #374151;">Goal:</span>
              <span style="color: #374151;">₹${goalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #374151;">Progress:</span>
              <span style="color: #059669; font-weight: bold;">${progress}%</span>
            </div>
            <div style="background-color: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 15px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 100%; width: ${progress}%; border-radius: 4px;"></div>
            </div>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Keep up the great work! Your campaign is gaining momentum.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            <strong>SeedLing</strong> - Crowdfunding Made Simple
          </p>
        </div>
      </div>
    `,
    text: `Hi ${creatorName},\n\nGreat news! ${displayDonorName}${anonymous ? ' (Anonymous)' : ''} just donated to your campaign ${campaignTitle}.\n\nNew Donation: ₹${amount.toLocaleString('en-IN')}${messageText}\n\nCampaign Progress:\n- Total Raised: ₹${currentAmount.toLocaleString('en-IN')}\n- Goal: ₹${goalAmount.toLocaleString('en-IN')}\n- Progress: ${progress}%\n\nKeep up the great work! Your campaign is gaining momentum.\n\nSeedLing - Crowdfunding Made Simple`,
  };

  const sendPromise = sgMail.send(msg);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('SendGrid request timeout')), 10000)
  );

  await Promise.race([sendPromise, timeoutPromise]);
  return true;
};

/**
 * Send donation notification email to campaign creator using SMTP
 */
const sendDonationEmailToCreatorSMTP = async (creatorEmail, creatorName, donorName, amount, campaignTitle, currentAmount, goalAmount) => {
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
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  };

  const transporter = nodemailer.createTransport(config);
  await transporter.verify();

  const progress = Math.min((currentAmount / goalAmount) * 100, 100).toFixed(1);

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'SeedLing'}" <${process.env.SMTP_USER}>`,
    to: creatorEmail,
    subject: `🎉 New Donation Received for ${campaignTitle}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
            <h2 style="color: #0284c7; margin: 0;">New Donation Received!</h2>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${creatorName},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Great news! <strong>${donorName}</strong> just donated to your campaign <strong>${campaignTitle}</strong>.
          </p>

          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">New Donation</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</p>
          </div>

          <div style="background-color: #eff6ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📊 Campaign Progress</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #374151;">Total Raised:</span>
              <span style="color: #1e40af; font-weight: bold;">₹${currentAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #374151;">Goal:</span>
              <span style="color: #374151;">₹${goalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #374151;">Progress:</span>
              <span style="color: #059669; font-weight: bold;">${progress}%</span>
            </div>
            <div style="background-color: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 15px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 100%; width: ${progress}%; border-radius: 4px;"></div>
            </div>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Keep up the great work! Your campaign is gaining momentum.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            <strong>SeedLing</strong> - Crowdfunding Made Simple
          </p>
        </div>
      </div>
    `,
    text: `Hi ${creatorName},\n\nGreat news! ${donorName} just donated to your campaign ${campaignTitle}.\n\nNew Donation: ₹${amount.toLocaleString('en-IN')}\n\nCampaign Progress:\n- Total Raised: ₹${currentAmount.toLocaleString('en-IN')}\n- Goal: ₹${goalAmount.toLocaleString('en-IN')}\n- Progress: ${progress}%\n\nKeep up the great work! Your campaign is gaining momentum.\n\nSeedLing - Crowdfunding Made Simple`,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

/**
 * Send donation email to donor
 * Automatically chooses best method: SendGrid API > SMTP
 */
const sendDonationEmailToDonor = async (donorEmail, donorName, amount, campaignTitle) => {
  // Development mode: If no email config, log to console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`
========================================
📧 DONATION EMAIL TO DONOR (DEVELOPMENT MODE)
========================================
To: ${donorEmail}
Name: ${donorName}
Amount: ₹${amount.toLocaleString('en-IN')}
Campaign: ${campaignTitle}
========================================
`);
    return true;
  }

  // Try SendGrid API first
  if (isSendGridAPIKey(process.env.SMTP_PASS)) {
    console.log('[Email] Sending donation email via SendGrid API to donor...');
    try {
      await sendDonationEmailToDonorSendGrid(donorEmail, donorName, amount, campaignTitle);
      console.log(`✅ Donation email sent to donor: ${donorEmail}`);
      return true;
    } catch (error) {
      console.log('[Email] SendGrid API failed:', error.message);
      console.log('[Email] Falling back to SMTP...');
    }
  }

  // Try SMTP fallback
  try {
    console.log('[Email] Attempting SMTP for donor email...');
    await sendDonationEmailToDonorSMTP(donorEmail, donorName, amount, campaignTitle);
    console.log(`✅ Donation email sent to donor: ${donorEmail}`);
    return true;
  } catch (error) {
    console.error('❌ SMTP failed for donor email:', error.message);
    return false;
  }
};

/**
 * Send donation notification email to campaign creator
 * Automatically chooses best method: SendGrid API > SMTP
 */
const sendDonationEmailToCreator = async (creatorEmail, creatorName, donorName, amount, campaignTitle, currentAmount, goalAmount) => {
  // Development mode: If no email config, log to console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`
========================================
📧 DONATION EMAIL TO CREATOR (DEVELOPMENT MODE)
========================================
To: ${creatorEmail}
Name: ${creatorName}
Donor: ${donorName}
Amount: ₹${amount.toLocaleString('en-IN')}
Campaign: ${campaignTitle}
Current Total: ₹${currentAmount.toLocaleString('en-IN')}
Goal: ₹${goalAmount.toLocaleString('en-IN')}
========================================
`);
    return true;
  }

  // Try SendGrid API first
  if (isSendGridAPIKey(process.env.SMTP_PASS)) {
    console.log('[Email] Sending donation email via SendGrid API to creator...');
    try {
      await sendDonationEmailToCreatorSendGrid(creatorEmail, creatorName, donorName, amount, campaignTitle, currentAmount, goalAmount);
      console.log(`✅ Donation email sent to creator: ${creatorEmail}`);
      return true;
    } catch (error) {
      console.log('[Email] SendGrid API failed:', error.message);
      console.log('[Email] Falling back to SMTP...');
    }
  }

  // Try SMTP fallback
  try {
    console.log('[Email] Attempting SMTP for creator email...');
    await sendDonationEmailToCreatorSMTP(creatorEmail, creatorName, donorName, amount, campaignTitle, currentAmount, goalAmount);
    console.log(`✅ Donation email sent to creator: ${creatorEmail}`);
    return true;
  } catch (error) {
    console.error('❌ SMTP failed for creator email:', error.message);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  generateOTP,
  sendDonationEmailToDonor,
  sendDonationEmailToCreator,
};
