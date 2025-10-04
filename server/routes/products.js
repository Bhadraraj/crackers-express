const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      category,
      active,
      featured,
      page = 1,
      limit = 50,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }
    if (active === 'true') filter.isActive = true;
    if (featured === 'true') filter.isFeatured = true;

    const products = await Product.find(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      search,
      populateCategory: true
    });

    const total = await Product.countDocuments(filter, search);

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

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id, true);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

router.post('/', [auth, adminAuth], upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').notEmpty().withMessage('Valid category is required'),
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
      category,
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
      features: features ? JSON.parse(features) : [],
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      isFeatured: Boolean(isFeatured),
      rating: parseFloat(rating) || 4.0,
      reviews: parseInt(reviews) || 0,
      sortOrder: parseInt(sortOrder) || 0
    };

    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.create(productData);
    const populatedProduct = await Product.findById(product.id, true);

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

router.put('/:id', [auth, adminAuth], upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').notEmpty().withMessage('Valid category is required'),
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

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      category,
      price: parseFloat(price),
      discount: parseFloat(discount) || 0,
      content: content?.trim() || '',
      features: features ? JSON.parse(features) : [],
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      isActive: isActive !== undefined ? Boolean(isActive) : product.isActive,
      isFeatured: Boolean(isFeatured),
      rating: parseFloat(rating) || 4.0,
      reviews: parseInt(reviews) || 0,
      sortOrder: parseInt(sortOrder) || 0
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    await Product.updateById(req.params.id, updateData);
    const updatedProduct = await Product.findById(req.params.id, true);

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.deleteById(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;
