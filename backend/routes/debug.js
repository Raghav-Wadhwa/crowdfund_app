const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Dev-only route to inspect a user by email
// Enabled when NODE_ENV !== 'production' OR DEBUG === 'true'
router.get('/user', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.DEBUG !== 'true') {
      return res.status(403).json({ success: false, message: 'Debug routes disabled in production' });
    }

    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'email query parameter is required' });
    }

    // Include password field to inspect hashing (only in dev)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.json({ success: true, found: false, email });
    }

    const passwordPresent = !!user.password;
    const passwordLooksHashed = passwordPresent && typeof user.password === 'string' && /^\$2[aby]\$/.test(user.password);

    res.json({
      success: true,
      found: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        passwordPresent,
        passwordLooksHashed,
        passwordLength: user.password ? user.password.length : 0
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
