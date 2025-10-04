const mongoose = require('mongoose');
const User = require('./models/User'); // adjust path if needed
require('dotenv').config();

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');

    const newUser = new User({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    });

    await newUser.save();
    console.log('User created');
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
}

createUser();