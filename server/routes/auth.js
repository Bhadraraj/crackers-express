const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  console.log('------------------------------------');
  console.log('Login attempt received at /api/auth/login!');
  console.log('Request Body:', req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login Validation failed:', errors.array());
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;
    console.log(`Processing login for user: ${username}`);

    const user = await User.findOne({ username, isActive: true }, true);
    if (!user) {
      console.log(`User '${username}' not found or inactive.`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`User '${username}' found.`);

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      console.log(`Password mismatch for user: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`Password matched for user: ${username}`);

    await User.updateLastLogin(user.id);
    console.log(`Last login updated for user: ${username}`);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log(`Token generated for user: ${username}. Login successful.`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        lastLogin: new Date()
      }
    });
  } catch (error) {
    console.error('Login error (caught in try-catch):', error);
    res.status(500).json({ message: 'Server error during login' });
  }
  console.log('------------------------------------');
});

router.get('/verify', auth, (req, res) => {
  console.log('Verify token route hit.');
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

router.post('/logout', auth, (req, res) => {
  console.log('Logout route hit.');
  res.json({ message: 'Logout successful' });
});

module.exports = router;
