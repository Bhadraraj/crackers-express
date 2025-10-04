const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log("Cleared existing data");

    // Create admin user
    const adminUser = new User({
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "admin123",
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created");
    
    const categories = [
      {
        name: "Sparklers",
        slug: "sparklers", // ADD THIS LINE
        description: "Beautiful sparklers for all occasions",
        globalDiscount: 5,
        sortOrder: 1,
      },
      {
        name: "Flower Pots",
        slug: "flower-pots", // ADD THIS LINE
        description: "Colorful flower pot fireworks",
        globalDiscount: 10,
        sortOrder: 2,
      },
      {
        name: "Ground Chakkars",
        slug: "ground-chakkars", // ADD THIS LINE
        description: "Spinning ground fireworks",
        globalDiscount: 8,
        sortOrder: 3,
      },
      {
        name: "Kids Special",
        slug: "kids-special", // ADD THIS LINE
        description: "Safe fireworks for children",
        globalDiscount: 15,
        sortOrder: 4,
      },
      {
        name: "Gift Boxes",
        slug: "gift-boxes", // ADD THIS LINE
        description: "Assorted fireworks gift boxes",
        globalDiscount: 12,
        sortOrder: 5,
      },
      {
        name: "Multi Colour Shots",
        slug: "multi-colour-shots", // ADD THIS LINE
        description: "Multi-shot colorful fireworks",
        globalDiscount: 7,
        sortOrder: 6,
      },
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log("Categories created");

    // Create sample products
    const products = [
      {
        name: "7cm Electric Sparklers",
        description:
          "Premium quality electric sparklers that produce bright golden sparks.",
        category: createdCategories[0]._id,
        price: 150,
        discount: 20,
        content: "10 pieces per box",
        features: [
          "Long burning time",
          "Bright golden sparks",
          "Safe to use",
          "Perfect for celebrations",
        ],
        stock: 100,
        isFeatured: true,
        rating: 4.5,
        reviews: 127,
      },
      {
        name: "12cm Color Sparklers",
        description: "Colorful sparklers that produce multiple colored sparks.",
        category: createdCategories[0]._id,
        price: 200,
        discount: 15,
        content: "5 pieces per box",
        features: [
          "Multi-color sparks",
          "Extended burning time",
          "Child-friendly",
          "Festival special",
        ],
        stock: 80,
        rating: 4.3,
        reviews: 89,
      },
      {
        name: "Big Flower Pot",
        description:
          "Beautiful flower-like sparks that create a stunning display.",
        category: createdCategories[1]._id,
        price: 80,
        discount: 25,
        content: "1 piece",
        features: [
          "Flower-like effects",
          "Colorful display",
          "Long duration",
          "Safe for home use",
        ],
        stock: 60,
        isFeatured: true,
        rating: 4.4,
        reviews: 203,
      },
      {
        name: "Special Flower Pot",
        description: "Premium flower pot with enhanced color effects.",
        category: createdCategories[1]._id,
        price: 120,
        discount: 20,
        content: "1 piece",
        features: [
          "Enhanced colors",
          "Premium quality",
          "Extended show",
          "Beautiful patterns",
        ],
        stock: 45,
        rating: 4.6,
        reviews: 178,
      },
      {
        name: "Big Ground Chakkar",
        description: "Spinning ground chakkar with colorful sparks.",
        category: createdCategories[2]._id,
        price: 100,
        discount: 18,
        content: "1 piece",
        features: [
          "Fast spinning",
          "Colorful sparks",
          "Long duration",
          "Ground level fun",
        ],
        stock: 70,
        rating: 4.2,
        reviews: 145,
      },
      {
        name: "Pop Pop (Kids Safe)",
        description: "Safe crackers specially designed for children.",
        category: createdCategories[3]._id,
        price: 50,
        discount: 30,
        content: "20 pieces per box",
        features: [
          "Child-safe",
          "No harmful effects",
          "Gentle sound",
          "Colorful packaging",
        ],
        stock: 150,
        isFeatured: true,
        rating: 4.8,
        reviews: 267,
      },
      {
        name: "Snake Tablets",
        description: "Fun snake-like tablets that create amusing effects.",
        category: createdCategories[3]._id,
        price: 30,
        discount: 25,
        content: "10 pieces per box",
        features: [
          "Snake-like effects",
          "Educational fun",
          "Safe for kids",
          "No loud sounds",
        ],
        stock: 120,
        rating: 4.3,
        reviews: 198,
      },
      {
        name: "Deluxe Gift Box",
        description:
          "Premium gift box with assorted crackers for special occasions.",
        category: createdCategories[4]._id,
        price: 1500,
        discount: 10,
        content: "Assorted crackers",
        features: [
          "Variety of crackers",
          "Beautiful packaging",
          "Perfect for gifts",
          "Premium selection",
        ],
        stock: 25,
        isFeatured: true,
        rating: 4.9,
        reviews: 89,
      },
      {
        name: "5 Shot Multi Color",
        description: "Multi-shot cracker with different colors in each shot.",
        category: createdCategories[5]._id,
        price: 200,
        discount: 15,
        content: "1 piece",
        features: [
          "5 different colors",
          "Sequential shots",
          "Bright display",
          "Professional grade",
        ],
        stock: 40,
        rating: 4.6,
        reviews: 134,
      },
    ];

    await Product.insertMany(products);
    console.log("Products created");

    console.log("Seed data created successfully!");
    console.log(
      `Admin credentials: ${adminUser.username} / ${
        process.env.ADMIN_PASSWORD || "admin123"
      }`
    );

    process.exit(0);
  } catch (error) {
    console.error("Seed data error:", error);
    process.exit(1);
  }
};

seedData();
