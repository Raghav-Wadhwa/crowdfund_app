/**
 * Main Server File
 * 
 * This is the entry point of our Express backend server.
 * It sets up middleware, connects to MongoDB, and registers routes.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env explicitly to avoid mismatches
dotenv.config({ path: path.join(__dirname, '.env') });

// REDACTED LOG: show which MongoDB URI (credentials removed) the server will use
if (process.env.MONGODB_URI) {
  try {
    const redacted = process.env.MONGODB_URI.replace(/(:\/\/)(.*@)/, '$1***@');
    console.log('Using MONGODB_URI (redacted):', redacted);
  } catch (e) {
    console.log('Using MONGODB_URI (raw):', process.env.MONGODB_URI ? '***present***' : 'not set');
  }
} else {
  console.log('MONGODB_URI not set in environment');
}

// Import routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const donationRoutes = require('./routes/donations');
// Debug routes (dev only)
const debugRoutes = require('./routes/debug');

// Initialize Express app
const app = express();

// Middleware
// CORS allows our React frontend (running on different port) to communicate with backend
app.use(cors());
// Parse JSON bodies (for POST/PUT requests)
app.use(express.json());
// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// Routes
// All authentication routes (register, login) will be prefixed with /api/auth
app.use('/api/auth', authRoutes);
// Campaign routes (create, get, update campaigns) prefixed with /api/campaigns
app.use('/api/campaigns', campaignRoutes);
// Donation routes prefixed with /api/donations
app.use('/api/donations', donationRoutes);

// Register debug routes under /api/debug
app.use('/api/debug', debugRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

// Connect to MongoDB
const PORT = process.env.PORT
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Log the connected database name and host for debugging
    try {
      console.log('Connected DB name:', mongoose.connection.name);
      console.log('Connected DB host:', mongoose.connection.host);
    } catch (e) {
      console.log('Could not read mongoose.connection details:', e.message);
    }
    // Start the server only after successful database connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit if database connection fails
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

