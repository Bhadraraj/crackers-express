const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    const filter = active === 'true' ? { isActive: true } : {};
    
    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create category
router.post('/', [auth, adminAuth], upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, globalDiscount, sortOrder } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || '',
      globalDiscount: parseFloat(globalDiscount) || 0,
      sortOrder: parseInt(sortOrder) || 0
    };

    if (req.file) {
      categoryData.image = `/uploads/${req.file.filename}`;
    }

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update category
router.put('/:id', [auth, adminAuth], upload.single('image'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, globalDiscount, sortOrder, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if name is being changed and if it conflicts
    if (name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }

    // Update fields
    category.name = name.trim();
    category.description = description?.trim() || '';
    category.globalDiscount = parseFloat(globalDiscount) || 0;
    category.sortOrder = parseInt(sortOrder) || 0;
    category.isActive = isActive !== undefined ? Boolean(isActive) : category.isActive;

    if (req.file) {
      category.image = `/uploads/${req.file.filename}`;
    }

    await category.save();

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete category
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It has ${productCount} products associated with it.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;