/**
 * Campaign Routes
 * 
 * Handles CRUD operations for campaigns:
 * - Create new campaigns
 * - Get all campaigns (with filtering and pagination)
 * - Get single campaign
 * - Update campaign
 * - Delete campaign
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private (only authenticated users)
 */
router.post(
  '/',
  auth, // Require authentication
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 50 })
      .withMessage('Description must be at least 50 characters long'),
    body('category')
      .isIn([
        'Technology',
        'Education',
        'Healthcare',
        'Art',
        'Environment',
        'Business',
        'Social',
        'Other',
      ])
      .withMessage('Invalid category selected'),
    body('goalAmount')
      .isFloat({ min: 1 })
      .withMessage('Goal amount must be at least $1'),
    body('deadline')
      .isISO8601()
      .toDate()
      .withMessage('Please provide a valid deadline date'),
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

      const { title, description, category, goalAmount, deadline, image } =
        req.body;

      // Create campaign (creator is set from authenticated user)
      const campaign = new Campaign({
        title,
        description,
        category,
        goalAmount,
        deadline,
        image: image || '',
        creator: req.user._id, // From auth middleware
      });

      await campaign.save();

      // Populate creator info before sending response
      await campaign.populate('creator', 'name email');

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        campaign,
      });
    } catch (error) {
      console.error('Campaign creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating campaign',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns (with filtering, sorting, pagination)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      status = 'active',
      sort = '-createdAt', // Default: newest first
      page = 1,
      limit = 12,
      search,
    } = req.query;

    // Build query object
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      // Search in title and description
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const campaigns = await Campaign.find(query)
      .populate('creator', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Campaign.countDocuments(query);

    res.json({
      success: true,
      campaigns,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalCampaigns: total,
        hasNext: skip + campaigns.length < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get single campaign by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      'creator',
      'name email avatar'
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Get recent donations for this campaign
    const donations = await Donation.find({ campaign: campaign._id })
      .populate('donor', 'name email avatar')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      campaign,
      recentDonations: donations,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign (only by creator)
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Check if user is the creator
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this campaign',
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'category',
      'goalAmount',
      'deadline',
      'image',
    ];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    await campaign.save();
    await campaign.populate('creator', 'name email avatar');

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating campaign',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete campaign (only by creator)
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Check if user is the creator
    if (campaign.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this campaign',
      });
    }

    // Delete all donations for this campaign
    await Donation.deleteMany({ campaign: campaign._id });

    // Delete campaign
    await Campaign.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting campaign',
      error: error.message,
    });
  }
});

module.exports = router;

