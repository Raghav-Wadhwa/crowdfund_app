/**
 * Authentication Routes
 * 
 * Handles user registration and login.
 * Uses express-validator for input validation.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const auth = require('../middleware/auth');
const { sendOTPEmail, generateOTP } = require('../utils/emailService');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user - sends OTP for verification
 * @access  Public
 */
router.post(
  '/register',
  [
    // Validation rules
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase();

      // Check if user already exists and is verified
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Delete any existing OTP for this email (case-insensitive)
      await OTP.deleteOne({ email: normalizedEmail });

      // Generate OTP
      const otp = generateOTP();
      console.log(`[OTP Register] Generated OTP for ${normalizedEmail}: ${otp}`);

      // Store OTP with user data temporarily
      const otpEntry = new OTP({
        email: normalizedEmail,
        otp,
        userData: { name, password },
      });
      await otpEntry.save();
      console.log(`[OTP Register] Saved to database`);

      // Send OTP email
      console.log(`[OTP Register] Attempting to send email to: ${email}`);
      const emailSent = await sendOTPEmail(email, otp, name);
      console.log(`[OTP Register] Email send result: ${emailSent ? 'SUCCESS' : 'FAILED'}`);

      // Even if email fails, we still create the OTP and allow verification
      // This is a fallback for production environments where SMTP might not be configured
      if (!emailSent) {
        console.log(`[OTP Register] Email failed but OTP still saved for manual verification`);
      }

      res.status(200).json({
        success: true,
        message: emailSent
          ? 'Verification code sent to your email'
          : 'Verification code generated (email not sent - check server logs for OTP)',
        email, // Return email for the verification step
        expiresIn: 600, // 10 minutes in seconds
        emailSent, // Tell frontend if email was actually sent
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Debug logs: show incoming body (avoid logging passwords in production)
      console.log('[/api/auth/login] incoming body:', { email, password: password ? '***REDACTED***' : undefined });

      // Find user and include password (since it's excluded by default)
      const user = await User.findOne({ email }).select('+password');

      console.log('[/api/auth/login] user found:', user ? { id: user._id, email: user.email, passwordPresent: !!user.password } : null);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No account found with this email. Please sign up to create an account.',
          suggestion: 'signup',
        });
      }

      // Compare password from User.js
      const isMatch = await user.comparePassword(password);
      console.log('[/api/auth/login] password match result:', isMatch);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        // For existing users who weren't verified (created before OTP system)
        // Create an OTP entry so they can verify now
        console.log(`[Login] Unverified user ${email} attempting login. Creating OTP...`);

        // Delete any existing OTP for this email
        await OTP.deleteOne({ email: email.toLowerCase() });

        // Generate OTP
        const otp = generateOTP();

        // Store OTP with user data (we use existing user data, but require them to re-verify)
        const otpEntry = new OTP({
          email: email.toLowerCase(),
          otp,
          userData: { name: user.name, password }, // Store current password attempt
        });
        await otpEntry.save();

        console.log(`[Login] Created OTP for existing user: ${otp}`);

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp, user.name);

        if (!emailSent) {
          await OTP.deleteOne({ email: email.toLowerCase() });
          return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.',
          });
        }

        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please verify your email first.',
          needsVerification: true,
          email: user.email,
        });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and complete registration
 * @access  Public
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be 6 digits'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, otp } = req.body;
      const normalizedEmail = email.toLowerCase();

      console.log(`[OTP Verify] Looking up OTP for:`, normalizedEmail);

      // Find OTP entry
      const otpEntry = await OTP.findOne({ email: normalizedEmail });

      if (!otpEntry) {
        return res.status(400).json({
          success: false,
          message: 'OTP expired or invalid. Please request a new one.',
        });
      }

      // Check if OTP matches
      if (otpEntry.otp !== otp) {
        // Increment attempts
        otpEntry.attempts += 1;
        await otpEntry.save();

        // Check if max attempts reached
        if (otpEntry.attempts >= 3) {
          await OTP.deleteOne({ email: normalizedEmail });
          return res.status(400).json({
            success: false,
            message: 'Too many failed attempts. Please request a new OTP.',
          });
        }

        return res.status(400).json({
          success: false,
          message: `Invalid OTP. ${3 - otpEntry.attempts} attempts remaining.`,
        });
      }

      // OTP verified - check if user exists or create new
      const { userData } = otpEntry;

      // Check if user already exists (for backwards compatibility with old unverified accounts)
      let user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Existing user - just mark as verified
        console.log(`[OTP Verify] Existing user found, marking as verified: ${user._id}`);
        user.isVerified = true;
        await user.save();
      } else {
        // New user - create account
        console.log(`[OTP Verify] Creating new user`);
        user = new User({
          name: userData.name,
          email: normalizedEmail,
          password: userData.password,
          isVerified: true,
        });
        await user.save();
      }

      // Delete OTP after successful verification
      await OTP.deleteOne({ email: normalizedEmail });

      console.log('[OTP Verify] User verified:', user._id);

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Email verified successfully! Welcome to SeedLing.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during verification',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 */
router.post(
  '/resend-otp',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email',
        });
      }

      const { email } = req.body;
      const normalizedEmail = email.toLowerCase();

      console.log(`[OTP Resend] Looking up OTP for:`, normalizedEmail);

      // Check if there's a pending OTP
      const otpEntry = await OTP.findOne({ email: normalizedEmail });

      if (!otpEntry) {
        return res.status(400).json({
          success: false,
          message: 'No pending verification found. Please register again.',
        });
      }

      // Check if last OTP was sent less than 60 seconds ago (rate limiting)
      const timeSinceLastOTP = Date.now() - otpEntry.createdAt.getTime();
      if (timeSinceLastOTP < 60000) {
        const waitTime = Math.ceil((60000 - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        });
      }

      // Generate new OTP
      const newOTP = generateOTP();
      console.log(`[OTP Resend] New OTP generated: ${newOTP}`);

      otpEntry.otp = newOTP;
      otpEntry.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Reset expiry
      otpEntry.attempts = 0; // Reset attempts
      await otpEntry.save();

      // Send new OTP email
      const emailSent = await sendOTPEmail(email, newOTP, otpEntry.userData.name);
      console.log(`[OTP Resend] Email send result:`, emailSent ? 'SUCCESS' : 'FAILED');

      res.json({
        success: true,
        message: emailSent
          ? 'New verification code sent to your email'
          : 'New verification code generated (check server logs for OTP)',
        expiresIn: 600,
        emailSent,
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', auth, async (req, res) => {
  try {
    // User is attached to req by auth middleware
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/auth/stats
 * @desc    Get current user's statistics (campaigns, donations)
 * @access  Private (requires authentication)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const Campaign = require('../models/Campaign');
    const Donation = require('../models/Donation');

    // Count campaigns created by user
    const campaignsCount = await Campaign.countDocuments({ 
      creator: req.user._id 
    });

    // Get total amount raised from user's campaigns
    const userCampaigns = await Campaign.find({ creator: req.user._id });
    const totalRaised = userCampaigns.reduce((sum, campaign) => sum + campaign.currentAmount, 0);

    // Count donations made by user
    const donationsCount = await Donation.countDocuments({ 
      donor: req.user._id 
    });

    // Get total amount donated by user
    const userDonations = await Donation.find({ donor: req.user._id });
    const totalDonated = userDonations.reduce((sum, donation) => sum + donation.amount, 0);

    res.json({
      success: true,
      stats: {
        campaignsCreated: campaignsCount,
        totalRaised: totalRaised,
        donationsMade: donationsCount,
        totalDonated: totalDonated,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private (requires authentication)
 */
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password field
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Check if new password is same as current
      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password',
        });
      }

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      console.log(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password',
        error: error.message,
      });
    }
  }
);

router.put('/update-profile', auth, [
  body('name').optional().trim().isLength({min:2}).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('avatar').optional().isString().withMessage('Please provide a valid URL for the avatar'),
], async (req, res) => {
  try{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }
    let hasChanges = false;
    const {name, email, avatar} = req.body;
    const user = await User.findById(req.user._id);
        if (
          name === user.name &&
          email === user.email &&
          avatar === user.avatar
        ) {
          return res.json({ success: true, message: "No changes made" });
        }
    if(!user){
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if(email && email !== user.email){
      const existingUser = await User.findOne({email});
      if(existingUser){
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        })
      }
      user.email = email;
      hasChanges = true;
    }
    if(name && name !== user.name){
      user.name = name;
      hasChanges = true;
    }
    if(avatar && avatar !== user.avatar){
      user.avatar = avatar;
      hasChanges = true;
    }
    if(!hasChanges){
      return res.json({ success: true, message: "No changes made" });
    }
    await user.save();
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    })
  }
  catch(error){
    console.log('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    })
  }
}
)

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin only)
 */
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Get all users (excluding passwords)
    const users = await User.find().select('-password').sort('-createdAt');

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
});

module.exports = router;

