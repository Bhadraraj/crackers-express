const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create({ username, password, role = 'admin', isActive = true }) {
    const id = uuidv4();
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.execute(
      `INSERT INTO users (id, username, password, role, is_active) VALUES (?, ?, ?, ?, ?)`,
      [id, username, hashedPassword, role, isActive]
    );

    return this.findById(id);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, username, role, is_active, last_login, created_at, updated_at FROM users WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return this.formatUser(rows[0]);
  }

  static async findByUsername(username, includePassword = false) {
    const fields = includePassword
      ? 'id, username, password, role, is_active, last_login, created_at, updated_at'
      : 'id, username, role, is_active, last_login, created_at, updated_at';

    const [rows] = await pool.execute(
      `SELECT ${fields} FROM users WHERE username = ?`,
      [username]
    );

    if (rows.length === 0) return null;
    return includePassword ? rows[0] : this.formatUser(rows[0]);
  }

  static async findOne(filter, includePassword = false) {
    const conditions = [];
    const values = [];

    Object.entries(filter).forEach(([key, value]) => {
      const dbKey = key === 'isActive' ? 'is_active' : key;
      conditions.push(`${dbKey} = ?`);
      values.push(value);
    });

    const fields = includePassword
      ? 'id, username, password, role, is_active, last_login, created_at, updated_at'
      : 'id, username, role, is_active, last_login, created_at, updated_at';

    const [rows] = await pool.execute(
      `SELECT ${fields} FROM users WHERE ${conditions.join(' AND ')}`,
      values
    );

    if (rows.length === 0) return null;
    return includePassword ? rows[0] : this.formatUser(rows[0]);
  }

  static async updateLastLogin(id) {
    await pool.execute(
      `UPDATE users SET last_login = NOW() WHERE id = ?`,
      [id]
    );
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static formatUser(user) {
    return {
      _id: user.id,
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}

module.exports = User;
