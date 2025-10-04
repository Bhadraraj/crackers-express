const User = require('../models/User');
const { testConnection } = require('../config/database');
require('dotenv').config();

async function createAdmin() {
  try {
    await testConnection();
    console.log('Connected to MySQL database');

    const existingAdmin = await User.findByUsername('admin');
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
