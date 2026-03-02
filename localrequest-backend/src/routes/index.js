const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const requestRoutes = require('./requests');
const notificationRoutes = require('./notifications');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LocalRequest API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/requests', requestRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
