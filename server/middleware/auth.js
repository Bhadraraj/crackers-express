const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  console.log('Auth middleware triggered.');
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('Auth middleware: No token provided.');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token decoded. userId:', decoded.userId);

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      console.log('Auth middleware: Invalid token or user inactive.');
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }
    console.log(`Auth middleware: User ${user.username} found and active.`);

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

const adminAuth = (req, res, next) => {
  console.log('Admin Auth middleware triggered. User role:', req.user?.role);
  if (req.user && req.user.role !== 'admin') {
    console.log('Admin Auth middleware: Access denied. Not an admin.');
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { auth, adminAuth };
