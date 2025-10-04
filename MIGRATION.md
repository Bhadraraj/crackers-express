# MongoDB to MySQL Migration Guide

This project has been successfully migrated from MongoDB to MySQL.

## Database Setup

### 1. Install MySQL

Make sure you have MySQL installed on your system. You can download it from:
- MySQL Community Server: https://dev.mysql.com/downloads/mysql/

### 2. Configure Environment Variables

Copy the `.env.example` file in the `server` directory to `.env` and update with your MySQL credentials:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file:

```
JWT_SECRET=your_jwt_secret_here_change_this_to_something_secure
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vishalini_fireworks
```

### 3. Initialize the Database

Run the database initialization script to create the database and tables:

```bash
cd server
npm run db:init
```

This will:
- Create the `vishalini_fireworks` database
- Create tables: `users`, `categories`, `products`
- Set up triggers for auto-calculation of final prices and slug generation

### 4. Create Admin User

Create a default admin user:

```bash
npm run db:seed
```

Default credentials:
- Username: `admin`
- Password: `admin123`

**Important:** Change this password after first login!

## Key Changes

### Database Structure

**Users Table:**
- UUID-based IDs
- Bcrypt password hashing
- Role-based access control (admin/user)
- Timestamps for created_at and updated_at

**Categories Table:**
- UUID-based IDs
- Auto-generated slugs
- Global discount support
- Active/inactive status

**Products Table:**
- UUID-based IDs
- Foreign key relationship with categories
- Auto-calculated final prices
- JSON arrays for images and features
- Low stock threshold tracking
- Active/featured flags

### What Was Changed

1. **Removed:**
   - Mongoose dependency
   - MongoDB connection code
   - Mongoose models

2. **Added:**
   - mysql2 library
   - UUID support
   - Class-based models with static methods
   - Database configuration module
   - Schema SQL file with triggers

3. **Updated:**
   - All route handlers to use new model API
   - Auth middleware to work with MySQL models
   - Server.js to connect to MySQL instead of MongoDB

### API Compatibility

The REST API endpoints remain the same. All existing frontend code continues to work without changes.

## Running the Application

### Development Mode

```bash
# Start the backend
cd server
npm run dev

# Start the frontend (in another terminal)
cd ../
npm run dev
```

### Production Build

```bash
# Build frontend
npm run build

# Start backend in production
cd server
NODE_ENV=production npm start
```

## Database Schema Location

The complete database schema is located at:
```
server/config/schema.sql
```

You can manually run this SQL file in your MySQL client if needed.

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify MySQL is running: `mysql -u root -p`
2. Check your `.env` credentials
3. Ensure the database exists or run `npm run db:init`

### Migration from Existing MongoDB Data

If you need to migrate existing MongoDB data:
1. Export data from MongoDB using `mongoexport`
2. Transform the data format (remove MongoDB-specific fields like `__v`)
3. Import into MySQL using custom scripts

## Notes

- All MongoDB ObjectIds have been replaced with UUIDs
- Populate functionality is implemented using SQL JOINs
- Aggregation queries are handled with native SQL
- Virtual fields (like discountPercentage) are calculated in model methods
