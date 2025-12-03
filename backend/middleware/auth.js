/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens to protect routes.
 * It extracts the token from the Authorization header and verifies it.
 * If valid, it attaches the user info to the request object.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware function that runs before protected routes
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Access denied.' 
      });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token (but exclude password)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Token invalid.' 
      });
    }

    // Attach user to request object so route handlers can access it
    req.user = user;
    next(); // Continue to the next middleware/route handler
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error', 
      error: error.message 
    });
  }
};

module.exports = auth;

