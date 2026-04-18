/**
 * Payment Routes
 *
 * Handles Razorpay payment integration for donations.
 * - Create payment orders
 * - Verify payments
 * - Update campaign funds after successful payment
 */

const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');

const router = express.Router();

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.log('⚠️  Razorpay not configured - payment features will be disabled');
  console.log('   Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env to enable');
}

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay order for donation
 * @access  Private (requires authentication)
 */
router.post('/create-order', auth, async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Please contact support.',
      });
    }

    const { amount, campaignId } = req.body;

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1',
      });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Check if campaign is active
    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This campaign is not accepting donations',
      });
    }

    // Create Razorpay order
    // Receipt must be <= 40 chars, so we use short format: rcp + timestamp (13) + random (4) = ~22 chars
    const shortReceipt = `rcp${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const options = {
      amount: Math.round(amount * 100), // Convert to paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: shortReceipt,
      notes: {
        campaignId: campaignId,
        donorId: req.user._id.toString(),
        donorName: req.user.name,
        donorEmail: req.user.email,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Send key to frontend
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment and update campaign
 * @access  Private (requires authentication)
 */
router.post('/verify', auth, async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Please contact support.',
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      campaignId,
      amount,
    } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature',
      });
    }

    // Find campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Check if payment already recorded (prevent duplicates)
    const existingDonation = await Donation.findOne({
      paymentId: razorpay_payment_id,
    });

    if (existingDonation) {
      return res.status(400).json({
        success: false,
        message: 'Payment already recorded',
      });
    }

    // Create donation record
    const donation = new Donation({
      campaign: campaignId,
      donor: req.user._id,
      amount: amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'completed',
    });
    await donation.save();

    // Update campaign funds
    campaign.currentAmount += amount;
    campaign.donorsCount += 1;

    // Check if goal reached
    if (campaign.currentAmount >= campaign.goalAmount) {
      campaign.status = 'completed';
    }

    await campaign.save();

    // Populate donor info for response
    await donation.populate('donor', 'name email avatar');

    res.json({
      success: true,
      message: 'Payment successful! Thank you for your donation.',
      donation: {
        id: donation._id,
        amount: donation.amount,
        campaign: {
          id: campaign._id,
          title: campaign.title,
          currentAmount: campaign.currentAmount,
          goalAmount: campaign.goalAmount,
          status: campaign.status,
        },
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/payments/my-donations
 * @desc    Get current user's donation history
 * @access  Private
 */
router.get('/my-donations', auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('campaign', 'title image status')
      .sort('-createdAt');

    res.json({
      success: true,
      donations,
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/payments/campaign-donations/:campaignId
 * @desc    Get donations for a specific campaign (creator only)
 * @access  Private
 */
router.get('/campaign-donations/:campaignId', auth, async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Check if user is campaign creator or admin
    const isCreator = campaign.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these donations',
      });
    }

    const donations = await Donation.find({ campaign: campaignId })
      .populate('donor', 'name email avatar')
      .sort('-createdAt');

    // Calculate stats
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    res.json({
      success: true,
      donations,
      stats: {
        totalDonations: donations.length,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('Get campaign donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: error.message,
    });
  }
});

module.exports = router;
