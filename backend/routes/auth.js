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
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
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

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Create new user (password will be hashed by pre-save hook)
      const user = new User({ name, email, password });
      await user.save();
      console.log('User created:', user);
      console.log('User ID:', user._id);
      // Generate token for the database user
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
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
          message: 'Invalid email or password',
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

