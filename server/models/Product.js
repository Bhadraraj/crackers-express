const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Product {
  static async create(productData) {
    const id = uuidv4();
    const {
      name,
      description,
      category,
      price,
      discount = 0,
      content = '',
      image = '',
      images = [],
      features = [],
      stock = 0,
      lowStockThreshold = 10,
      isActive = true,
      isFeatured = false,
      rating = 4.0,
      reviews = 0,
      sortOrder = 0
    } = productData;

    const finalPrice = price - (price * discount / 100);

    const [result] = await pool.execute(
      `INSERT INTO products (
        id, name, description, category_id, price, discount, final_price,
        content, image, images, features, stock, low_stock_threshold,
        is_active, is_featured, rating, reviews, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, description, category, price, discount, finalPrice,
        content, image,
        JSON.stringify(images),
        JSON.stringify(features),
        stock, lowStockThreshold, isActive, isFeatured, rating, reviews, sortOrder
      ]
    );

    return this.findById(id);
  }

  static async findById(id, populateCategory = false) {
    let query = `SELECT p.* FROM products p WHERE p.id = ?`;

    if (populateCategory) {
      query = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `;
    }

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) return null;
    return this.formatProduct(rows[0], populateCategory);
  }

  static async find(filter = {}, options = {}) {
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc', search = '', populateCategory = false } = options;

    const conditions = [];
    const values = [];

    if (filter.category && filter.category !== 'all') {
      conditions.push('p.category_id = ?');
      values.push(filter.category);
    }

    if (filter.isActive !== undefined) {
      conditions.push('p.is_active = ?');
      values.push(filter.isActive);
    }

    if (filter.isFeatured !== undefined) {
      conditions.push('p.is_featured = ?');
      values.push(filter.isFeatured);
    }

    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.content LIKE ?)');
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    let query = populateCategory
      ? `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id`
      : `SELECT p.* FROM products p`;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const sortField = this.toSnakeCase(sortBy);
    const sortDir = sortOrder === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY p.${sortField} ${sortDir}`;

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    values.push(limit, offset);

    const [rows] = await pool.execute(query, values);
    return rows.map(row => this.formatProduct(row, populateCategory));
  }

  static async countDocuments(filter = {}, search = '') {
    const conditions = [];
    const values = [];

    if (filter.category && filter.category !== 'all') {
      conditions.push('category_id = ?');
      values.push(filter.category);
    }

    if (filter.isActive !== undefined) {
      conditions.push('is_active = ?');
      values.push(filter.isActive);
    }

    if (filter.isFeatured !== undefined) {
      conditions.push('is_featured = ?');
      values.push(filter.isFeatured);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR content LIKE ?)');
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    if (filter.$expr) {
      conditions.push('stock <= low_stock_threshold');
    }

    let query = `SELECT COUNT(*) as count FROM products`;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const [rows] = await pool.execute(query, values);
    return rows[0].count;
  }

  static async updateById(id, data) {
    const updates = [];
    const values = [];

    const fieldMap = {
      name: 'name',
      description: 'description',
      category: 'category_id',
      price: 'price',
      discount: 'discount',
      content: 'content',
      image: 'image',
      images: 'images',
      features: 'features',
      stock: 'stock',
      lowStockThreshold: 'low_stock_threshold',
      isActive: 'is_active',
      isFeatured: 'is_featured',
      rating: 'rating',
      reviews: 'reviews',
      sortOrder: 'sort_order'
    };

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'id') return;

      const dbKey = fieldMap[key] || this.toSnakeCase(key);
      updates.push(`${dbKey} = ?`);

      if (key === 'images' || key === 'features') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async deleteById(id) {
    const [result] = await pool.execute(
      `DELETE FROM products WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  static async aggregate(pipeline) {
    if (!Array.isArray(pipeline) || pipeline.length === 0) {
      return [];
    }

    const firstStage = pipeline[0];

    if (firstStage.$group) {
      if (firstStage.$group._id === null && firstStage.$group.total) {
        const [rows] = await pool.execute('SELECT SUM(stock) as total FROM products');
        return [{ _id: null, total: rows[0].total || 0 }];
      }

      if (firstStage.$group._id === null && firstStage.$group.average) {
        const [rows] = await pool.execute('SELECT AVG(price) as average FROM products');
        return [{ _id: null, average: rows[0].average || 0 }];
      }
    }

    if (firstStage.$lookup) {
      const query = `
        SELECT
          p.category_id as _id,
          c.name as name,
          COUNT(*) as count,
          SUM(p.stock) as totalStock,
          AVG(p.price) as averagePrice
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        GROUP BY p.category_id, c.name
        ORDER BY count DESC
      `;

      const [rows] = await pool.execute(query);
      return rows.map(row => ({
        _id: row._id,
        name: row.name,
        count: row.count,
        totalStock: row.totalStock || 0,
        averagePrice: parseFloat(row.averagePrice) || 0
      }));
    }

    return [];
  }

  static toSnakeCase(str) {
    const map = {
      categoryId: 'category_id',
      finalPrice: 'final_price',
      lowStockThreshold: 'low_stock_threshold',
      isActive: 'is_active',
      isFeatured: 'is_featured',
      sortOrder: 'sort_order',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      actualPrice: 'price',
      discountedPrice: 'price'
    };
    return map[str] || str;
  }

  static formatProduct(product, populateCategory = false) {
    const formatted = {
      _id: product.id,
      id: product.id,
      name: product.name,
      description: product.description,
      category: populateCategory && product.category_name
        ? { name: product.category_name, slug: product.category_slug, _id: product.category_id }
        : product.category_id,
      price: parseFloat(product.price),
      discount: parseFloat(product.discount),
      finalPrice: parseFloat(product.final_price),
      content: product.content,
      image: product.image,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []),
      features: typeof product.features === 'string' ? JSON.parse(product.features) : (product.features || []),
      stock: product.stock,
      lowStockThreshold: product.low_stock_threshold,
      isActive: Boolean(product.is_active),
      isFeatured: Boolean(product.is_featured),
      rating: parseFloat(product.rating),
      reviews: product.reviews,
      sortOrder: product.sort_order,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      discountAmount: parseFloat(product.price) - parseFloat(product.final_price),
      discountPercentage: Math.round(((parseFloat(product.price) - parseFloat(product.final_price)) / parseFloat(product.price)) * 100),
      isLowStock: product.stock <= product.low_stock_threshold
    };

    return formatted;
  }
}

module.exports = Product;
