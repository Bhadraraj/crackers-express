const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const [
      totalProducts,
      totalCategories,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      lowStockProducts,
      totalStockResult,
      averagePriceResult
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ $expr: true }),
      Product.aggregate([{ $group: { _id: null, total: { $sum: '$stock' } } }]),
      Product.aggregate([{ $group: { _id: null, average: { $avg: '$price' } } }])
    ]);

    const totalStock = totalStockResult[0]?.total || 0;
    const averagePrice = averagePriceResult[0]?.average || 0;

    const categoryStats = await Product.aggregate([{ $lookup: {} }]);

    const [lowStockProductsRows] = await pool.execute(`
      SELECT p.id, p.name, p.stock, p.low_stock_threshold, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= p.low_stock_threshold
      ORDER BY p.stock ASC
      LIMIT 10
    `);

    const lowStockProductsList = lowStockProductsRows.map(row => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      stock: row.stock,
      lowStockThreshold: row.low_stock_threshold,
      category: { name: row.category_name }
    }));

    const [recentProductsRows] = await pool.execute(`
      SELECT p.id, p.name, p.price, p.final_price, p.created_at, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    const recentProducts = recentProductsRows.map(row => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      finalPrice: parseFloat(row.final_price),
      createdAt: row.created_at,
      category: { name: row.category_name }
    }));

    res.json({
      overview: {
        totalProducts,
        totalCategories,
        activeProducts,
        inactiveProducts,
        featuredProducts,
        lowStockCount: lowStockProducts,
        totalStock,
        averagePrice
      },
      categoryStats,
      lowStockProducts: lowStockProductsList,
      recentProducts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

module.exports = router;
