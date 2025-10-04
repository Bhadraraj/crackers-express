const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const [
      totalProducts,
      totalCategories,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      lowStockProducts,
      totalStock,
      averagePrice
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      Product.aggregate([
        { $group: { _id: null, total: { $sum: '$stock' } } }
      ]),
      Product.aggregate([
        { $group: { _id: null, average: { $avg: '$price' } } }
      ])
    ]);

    // Get category-wise product count
    const categoryStats = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          averagePrice: { $avg: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get low stock products
    const lowStockProductsList = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
    .populate('category', 'name')
    .select('name stock lowStockThreshold category')
    .sort({ stock: 1 })
    .limit(10);

    // Get recent products
    const recentProducts = await Product.find()
      .populate('category', 'name')
      .select('name price finalPrice category createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      overview: {
        totalProducts,
        totalCategories,
        activeProducts,
        inactiveProducts,
        featuredProducts,
        lowStockCount: lowStockProducts,
        totalStock: totalStock[0]?.total || 0,
        averagePrice: averagePrice[0]?.average || 0
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