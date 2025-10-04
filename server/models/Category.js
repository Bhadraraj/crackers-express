const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Category {
  static async create({ name, slug, description = '', image = '', isActive = true, sortOrder = 0, globalDiscount = 0 }) {
    const id = uuidv4();

    if (!slug || slug === '') {
      slug = this.generateSlug(name);
    }

    const [result] = await pool.execute(
      `INSERT INTO categories (id, name, slug, description, image, is_active, sort_order, global_discount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, slug, description, image, isActive, sortOrder, globalDiscount]
    );

    return this.findById(id);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM categories WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return this.formatCategory(rows[0]);
  }

  static async findOne(filter) {
    const conditions = [];
    const values = [];

    Object.entries(filter).forEach(([key, value]) => {
      const dbKey = this.toSnakeCase(key);
      conditions.push(`${dbKey} = ?`);
      values.push(value);
    });

    const [rows] = await pool.execute(
      `SELECT * FROM categories WHERE ${conditions.join(' AND ')}`,
      values
    );

    if (rows.length === 0) return null;
    return this.formatCategory(rows[0]);
  }

  static async find(filter = {}) {
    let query = `SELECT * FROM categories`;
    const conditions = [];
    const values = [];

    Object.entries(filter).forEach(([key, value]) => {
      const dbKey = this.toSnakeCase(key);
      conditions.push(`${dbKey} = ?`);
      values.push(value);
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY sort_order ASC, name ASC`;

    const [rows] = await pool.execute(query, values);
    return rows.map(row => this.formatCategory(row));
  }

  static async updateById(id, data) {
    const updates = [];
    const values = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'id') return;
      const dbKey = this.toSnakeCase(key);
      updates.push(`${dbKey} = ?`);
      values.push(value);
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async deleteById(id) {
    const [result] = await pool.execute(
      `DELETE FROM categories WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  static async countDocuments(filter = {}) {
    let query = `SELECT COUNT(*) as count FROM categories`;
    const conditions = [];
    const values = [];

    Object.entries(filter).forEach(([key, value]) => {
      const dbKey = this.toSnakeCase(key);
      conditions.push(`${dbKey} = ?`);
      values.push(value);
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const [rows] = await pool.execute(query, values);
    return rows[0].count;
  }

  static generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  static toSnakeCase(str) {
    const map = {
      isActive: 'is_active',
      sortOrder: 'sort_order',
      globalDiscount: 'global_discount',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    return map[str] || str;
  }

  static formatCategory(category) {
    return {
      _id: category.id,
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      globalDiscount: parseFloat(category.global_discount),
      createdAt: category.created_at,
      updatedAt: category.updated_at
    };
  }
}

module.exports = Category;
