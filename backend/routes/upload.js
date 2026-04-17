/**
 * Upload Routes
 *
 * Handles image uploads to Cloudinary for avatars and campaign images.
 * Uses multer for temporary file storage, then uploads to Cloudinary.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadImage, deleteImage, getPublicIdFromUrl } = require('../utils/cloudinary');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Campaign = require('../models/Campaign');

const router = express.Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/'); // Temporary folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload user avatar to Cloudinary
 * @access  Private (requires authentication)
 */
router.post('/avatar', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Generate unique public ID based on user ID
    const publicId = `user-${req.user._id}`;

    // Upload to Cloudinary
    const result = await uploadImage(req.file.path, 'avatars', publicId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: result.error,
      });
    }

    // Update user's avatar URL in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.url },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      url: result.url,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/upload/campaign/:id
 * @desc    Upload campaign image to Cloudinary
 * @access  Private (requires authentication, must be campaign creator)
 */
router.post('/campaign/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const { id } = req.params;

    // Find campaign and check ownership
    const campaign = await Campaign.findById(id);
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

    // Generate unique public ID
    const publicId = `campaign-${id}`;

    // If there's an old image, we could delete it (optional)
    if (campaign.image && campaign.image.includes('cloudinary.com')) {
      const oldPublicId = getPublicIdFromUrl(campaign.image);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.path, 'campaigns', publicId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: result.error,
      });
    }

    // Update campaign with new image URL
    campaign.image = result.url;
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign image uploaded successfully',
      url: result.url,
      campaign: {
        id: campaign._id,
        title: campaign.title,
        image: campaign.image,
      },
    });
  } catch (error) {
    console.error('Campaign upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/upload/avatar
 * @desc    Delete user avatar from Cloudinary
 * @access  Private
 */
router.delete('/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.avatar || !user.avatar.includes('cloudinary.com')) {
      return res.status(400).json({
        success: false,
        message: 'No Cloudinary avatar to delete',
      });
    }

    // Get public ID and delete from Cloudinary
    const publicId = getPublicIdFromUrl(user.avatar);
    if (publicId) {
      await deleteImage(publicId);
    }

    // Remove avatar from user
    user.avatar = '';
    await user.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during delete',
      error: error.message,
    });
  }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
  }

  if (error.message === 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.') {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

module.exports = router;
