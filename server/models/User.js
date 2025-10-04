// C:\Users\Hp\Downloads\project-bolt-sb1-1h6e9eyp (5)\project\server\models\User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Ensure you have bcryptjs installed

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Hash password before saving (Mongoose pre-save hook)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash if password was modified

  try {
    const salt = await bcrypt.genSalt(12); // Generate a salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next();
  } catch (error) {
    next(error); // Pass any errors to Mongoose
  }
});

// Method to compare candidate password with stored hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password field from JSON output for security
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);