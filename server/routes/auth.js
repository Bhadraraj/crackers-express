// C:\Users\Hp\Downloads\project-bolt-sb1-1h6e9eyp (5)\project\server\routes\auth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User'); // Path to your User model
const { auth } = require('../middleware/auth'); // Path to your auth middleware

const router = express.Router();

// Login Route
router.post('/login', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  console.log('------------------------------------'); // Debugging log
  console.log('Login attempt received at /api/auth/login!'); // Debugging log
  console.log('Request Body:', req.body); // Debugging log

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login Validation failed:', errors.array()); // Debugging log
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;
    console.log(`Processing login for user: ${username}`); // Debugging log

    // Find user by username and check if active
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      console.log(`User '${username}' not found or inactive.`); // Debugging log
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`User '${username}' found.`); // Debugging log

    // Compare provided password with stored hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Password mismatch for user: ${username}`); // Debugging log
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`Password matched for user: ${username}`); // Debugging log

    // Update last login timestamp and save
    user.lastLogin = new Date();
    await user.save();
    console.log(`Last login updated for user: ${username}`); // Debugging log

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Payload for the token
      process.env.JWT_SECRET, // Secret key from environment variables
      { expiresIn: '24h' } // Token expires in 24 hours
    );
    console.log(`Token generated for user: ${username}. Login successful.`); // Debugging log

    // Send successful login response with token and user details
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error (caught in try-catch):', error); // Existing error log
    res.status(500).json({ message: 'Server error during login' });
  }
  console.log('------------------------------------'); // Debugging log
});

// Verify Token Route (protected by 'auth' middleware)
router.get('/verify', auth, (req, res) => {
  console.log('Verify token route hit.'); // Debugging log
  res.json({
    message: 'Token is valid',
    user: req.user // 'req.user' is populated by the 'auth' middleware
  });
});

// Logout Route (client-side token removal, also protected by 'auth' middleware)
router.post('/logout', auth, (req, res) => {
  console.log('Logout route hit.'); // Debugging log
  res.json({ message: 'Logout successful' }); // Server doesn't invalidate tokens, client removes it
});

module.exports = router;