/**
 * Donation Routes
 * 
 * Handles donation operations:
 * - Create new donations
 * - Get donations for a campaign
 * - Get user's donation history
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendDonationEmailToDonor, sendDonationEmailToCreator } = require('../utils/emailService');

const router = express.Router();

/**
 * @route   POST /api/donations
 * @desc    Create a new donation
 * @access  Private
 */
router.post(
  '/',
  auth,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
    body('campaign').notEmpty().withMessage('Campaign ID is required'),
    body('message').optional().isLength({ max: 500 }),
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

      const { amount, campaign: campaignId, message, anonymous } = req.body;

      // Check if campaign exists and populate creator info
      const campaign = await Campaign.findById(campaignId).populate('creator', 'name email');
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Check if campaign is still active
      if (campaign.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot donate to inactive campaign',
        });
      }

      // Prevent self-donation (optional - remove if you want to allow it)
      if (campaign.creator.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot donate to your own campaign',
        });
      }

      // Check if donation exceeds remaining amount needed
      const remainingAmount = campaign.goalAmount - campaign.currentAmount;
      if (remainingAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Campaign has already reached its goal',
        });
      }
      
      if (amount > remainingAmount) {
        return res.status(400).json({
          success: false,
          message: `Donation amount exceeds the remaining goal. Maximum donation: $${remainingAmount.toFixed(2)}`,
          remainingAmount: remainingAmount,
        });
      }

      // Create donation
      const donation = new Donation({
        amount,
        donor: req.user._id,
        campaign: campaignId,
        message: message || '',
        anonymous: anonymous || false,
      });

      await donation.save();

      // Update campaign: increase currentAmount and donorsCount
      campaign.currentAmount += amount;
      campaign.donorsCount += 1;

      // Check if goal is reached
      if (campaign.currentAmount >= campaign.goalAmount) {
        campaign.status = 'completed';
      }

      await campaign.save();

      // Populate donation with donor and campaign info
      await donation.populate('donor', 'name email avatar');
      await donation.populate('campaign', 'title');

      // Send notification emails (don't block response on email failures)
      console.log('[Donation] Preparing to send notification emails...');
      try {
        const donor = await User.findById(req.user._id);
        const creator = campaign.creator;

        console.log('[Donation] Donor:', donor?.email, 'Creator:', creator?.email);

        // Send thank you email to donor
        if (donor && donor.email) {
          console.log('[Donation] Sending thank you email to donor:', donor.email);
          sendDonationEmailToDonor(
            donor.email,
            donor.name,
            amount,
            campaign.title
          ).then(() => console.log('[Donation] Donor email sent successfully'))
           .catch(err => console.log('[Donation] Failed to send donor email:', err.message));
        } else {
          console.log('[Donation] No donor email found, skipping donor notification');
        }

        // Send notification email to campaign creator
        if (creator && creator.email) {
          console.log('[Donation] Sending notification email to creator:', creator.email);
          sendDonationEmailToCreator(
            creator.email,
            creator.name,
            donor ? donor.name : 'Someone',
            amount,
            campaign.title,
            campaign.currentAmount,
            campaign.goalAmount
          ).then(() => console.log('[Donation] Creator email sent successfully'))
           .catch(err => console.log('[Donation] Failed to send creator email:', err.message));
        } else {
          console.log('[Donation] No creator email found, skipping creator notification');
        }
      } catch (emailError) {
        console.log('[Donation] Error sending donation emails:', emailError.message);
        // Don't fail the donation if emails fail
      }

      res.status(201).json({
        success: true,
        message: 'Donation successful! Thank you for your contribution.',
        donation,
      });
    } catch (error) {
      console.error('Donation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing donation',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/donations/campaign/:campaignId
 * @desc    Get all donations for a specific campaign
 * @access  Public
 */
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 50 } = req.query;

    const donations = await Donation.find({ campaign: campaignId })
      .populate('donor', 'name email avatar')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      success: true,
      donations,
      count: donations.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/donations/my-donations
 * @desc    Get current user's donation history
 * @access  Private
 */
router.get('/my-donations', auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('campaign', 'title image goalAmount currentAmount')
      .sort('-createdAt');

    res.json({
      success: true,
      donations,
      totalDonated: donations.reduce((sum, d) => sum + d.amount, 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: error.message,
    });
  }
});

module.exports = router;

