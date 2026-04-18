/**
 * Donation Model
 *
 * Tracks all donations made to campaigns.
 * Links donors to campaigns and stores donation amounts.
 */

const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Donation amount is required'],
      min: [1, 'Donation amount must be at least ₹1'],
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign', // Reference to Campaign model
      required: true,
    },
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
    anonymous: {
      type: Boolean,
      default: false, // If true, donor name won't be shown publicly
    },
    // Payment-specific fields for Razorpay
    paymentId: {
      type: String,
      required: true,
      unique: true, // Each payment has a unique ID
    },
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance (paymentId already indexed via unique: true)
donationSchema.index({ campaign: 1 });
donationSchema.index({ donor: 1 });

module.exports = mongoose.model('Donation', donationSchema);

