// C:\Users\Hp\Downloads\project-bolt-sb1-1h6e9eyp (5)\project\server\middleware\auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Path to your User model

const auth = async (req, res, next) => {
  console.log('Auth middleware triggered.'); // Debugging log
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware: No token provided.'); // Debugging log
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token decoded. userId:', decoded.userId); // Debugging log

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      console.log('Auth middleware: Invalid token or user inactive.'); // Debugging log
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }
    console.log(`Auth middleware: User ${user.username} found and active.`); // Debugging log

    req.user = user; // Attach user object to the request
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message); // Debugging log
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
  console.log('Admin Auth middleware triggered. User role:', req.user?.role); // Debugging log
  if (req.user && req.user.role !== 'admin') {
    console.log('Admin Auth middleware: Access denied. Not an admin.'); // Debugging log
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next(); // Proceed if user is admin
};

module.exports = { auth, adminAuth };