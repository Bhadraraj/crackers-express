// routes/products.js (Your existing backend code)

const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category'); // Make sure you have this model
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Make sure you have this middleware

const router = express.Router();

// Get all products with pagination, search, filter, and sort
router.get('/', async (req, res) => {
  try {
    const {
      category, // This will be the _id of the category
      active,
      featured,
      page = 1,
      limit = 50,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};

    if (category && category !== 'all') { // Check for 'all' to avoid filtering by category if not needed
      filter.category = category; // Filter by category _id
    }
    if (active === 'true') filter.isActive = true;
    if (featured === 'true') filter.isFeatured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } } // Added content to search
      ];
    }

    const sortOptions = {};
    // Map frontend sort keys to backend fields if they differ
    if (sortBy === 'price') { // If frontend sends 'price'
        sortOptions.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'actualPrice' || sortBy === 'discountedPrice') {
        // Backend stores original price, so sort by 'price'
        sortOptions.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
        sortOptions.rating = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'reviews') {
        sortOptions.reviews = sortOrder === 'desc' ? -1 : 1;
    }
    else { // Default to name or other general fields
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }


    const products = await Product.find(filter)
      .populate('category', 'name slug') // Populate category to get its name and slug
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get product by ID (no changes needed)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug'); // Populate category
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create product (no core logic changes needed, but ensure image upload is working)
router.post('/', [auth, adminAuth], upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      category, // This should be the category _id
      price,
      discount,
      content,
      features,
      stock,
      lowStockThreshold,
      isFeatured,
      rating,
      reviews,
      sortOrder
    } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const productData = {
      name: name.trim(),
      description: description.trim(),
      category,
      price: parseFloat(price),
      discount: parseFloat(discount) || 0,
      content: content?.trim() || '',
      features: features ? JSON.parse(features) : [], // Ensure features is parsed if sent as string
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      isFeatured: Boolean(isFeatured),
      rating: parseFloat(rating) || 4.0,
      reviews: parseInt(reviews) || 0,
      sortOrder: parseInt(sortOrder) || 0
    };

    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`; // Image path
    }

    const product = new Product(productData);
    await product.save();
    
    await product.populate('category', 'name slug'); // Populate after saving

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product (no core logic changes needed)
router.put('/:id', [auth, adminAuth], upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      description,
      category,
      price,
      discount,
      content,
      features,
      stock,
      lowStockThreshold,
      isActive,
      isFeatured,
      rating,
      reviews,
      sortOrder
    } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Update fields
    product.name = name.trim();
    product.description = description.trim();
    product.category = category;
    product.price = parseFloat(price);
    product.discount = parseFloat(discount) || 0;
    product.content = content?.trim() || '';
    product.features = features ? JSON.parse(features) : [];
    product.stock = parseInt(stock) || 0;
    product.lowStockThreshold = parseInt(lowStockThreshold) || 10;
    product.isActive = isActive !== undefined ? Boolean(isActive) : product.isActive;
    product.isFeatured = Boolean(isFeatured);
    product.rating = parseFloat(rating) || 4.0;
    product.reviews = parseInt(reviews) || 0;
    product.sortOrder = parseInt(sortOrder) || 0;

    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
    }

    await product.save();
    await product.populate('category', 'name slug');

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product (no changes needed)
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;