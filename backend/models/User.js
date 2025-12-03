/**
 * User Model
 * 
 * Defines the schema for user accounts in our database.
 * Mongoose schemas define the structure and validation rules for documents.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true, // Removes whitespace from both ends
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Ensures no duplicate emails
      lowercase: true, // Converts to lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'], // Email validation regex
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default in queries (security)
    },
    avatar: {
      type: String, // URL to avatar image
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Only allow these values
      default: 'user',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save hook: Hash password before saving to database
// This runs automatically before saving a new user or updating password
userSchema.pre('save', async function (next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt (random data) and hash password
    // 10 is the number of salt rounds (higher = more secure but slower)
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method: Compare password with hashed password
// This method is available on user instances: user.comparePassword('plainPassword')
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Convert mongoose model to JSON, but exclude password
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);

