/**
 * Campaign Model
 * 
 * Defines the schema for crowdfunding campaigns.
 * Each campaign represents a fundraising project.
 */

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required'],
      minlength: [50, 'Description must be at least 50 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Technology',
        'Education',
        'Healthcare',
        'Art',
        'Environment',
        'Business',
        'Social',
        'Other',
      ],
    },
    goalAmount: {
      type: Number,
      required: [true, 'Goal amount is required'],
      min: [1, 'Goal amount must be at least $1'],
    },
    currentAmount: {
      type: Number,
      default: 0, // Starts at 0, increases with donations
      min: [0, 'Current amount cannot be negative'],
    },
    image: {
      type: String, // URL to campaign image
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      validate: {
        validator: function (date) {
          // Deadline must be in the future
          return date > new Date();
        },
        message: 'Deadline must be in the future',
      },
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    donorsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
campaignSchema.index({ creator: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ category: 1 });

// Virtual field: Calculate progress percentage
campaignSchema.virtual('progress').get(function () {
  return Math.min((this.currentAmount / this.goalAmount) * 100, 100).toFixed(2);
});

// Ensure virtual fields are included in JSON output
campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);

