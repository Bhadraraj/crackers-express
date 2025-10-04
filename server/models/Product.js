const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  features: [{
    type: String
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate final price before saving
productSchema.pre('save', function(next) {
  this.finalPrice = this.price - (this.price * this.discount / 100);
  next();
});

// Virtual for discount amount
productSchema.virtual('discountAmount').get(function() {
  return this.price - this.finalPrice;
});

// Virtual for discount percentage display
productSchema.virtual('discountPercentage').get(function() {
  return Math.round(((this.price - this.finalPrice) / this.price) * 100);
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);