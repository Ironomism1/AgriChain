const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

/**
 * POST /api/auth/register
 * Register a new user (farmer or buyer)
 */
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('phone').notEmpty(),
  body('role').isIn(['farmer', 'buyer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, phone, role, district } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({
      email,
      password,
      name,
      phone,
      role,
      district: role === 'farmer' ? district : undefined
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        district: user.district
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user and select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        district: user.district
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token', authMiddleware, (req, res) => {
  try {
    const newToken = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      message: 'Token refreshed',
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/all-users
 * Get all users (excluding current user) for chat
 */
router.get('/all-users', authMiddleware, async (req, res) => {
  try {
    console.log('=== /all-users endpoint called ===');
    console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('Current user ID:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.log('ERROR: No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUserId = req.user.id;

    // Get ALL users first to debug
    const allUsers = await User.find({}).select('_id name phone role').limit(100);
    console.log('Total users in DB:', allUsers.length);
    
    // Get all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('_id name phone role')
      .limit(100);

    console.log('Found users (excluding current):', users.length);
    console.log('Sample user:', users[0] ? JSON.stringify(users[0]) : 'No users found');

    res.status(200).json({
      success: true,
      totalInDB: allUsers.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/auth/test-users
 * Test endpoint to check if users exist (no auth required)
 */
router.get('/test-users', async (req, res) => {
  try {
    const count = await User.countDocuments();
    const users = await User.find({}).select('_id name phone role').limit(5);
    res.status(200).json({
      success: true,
      totalCount: count,
      sampleUsers: users
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users', message: error.message });
  }
});

module.exports = router;
