-- Create database
CREATE DATABASE IF NOT EXISTS vishalini_fireworks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vishalini_fireworks;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(30) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT username_length CHECK (CHAR_LENGTH(username) >= 3 AND CHAR_LENGTH(username) <= 30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  global_discount DECIMAL(5,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT category_name_length CHECK (CHAR_LENGTH(name) >= 1 AND CHAR_LENGTH(name) <= 100),
  CONSTRAINT category_description_length CHECK (CHAR_LENGTH(description) <= 500),
  CONSTRAINT category_global_discount_range CHECK (global_discount >= 0 AND global_discount <= 100),
  INDEX idx_categories_is_active (is_active),
  INDEX idx_categories_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id CHAR(36) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0.00,
  final_price DECIMAL(10,2) DEFAULT 0.00,
  content TEXT,
  image VARCHAR(255) DEFAULT '',
  images JSON,
  features JSON,
  stock INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2,1) DEFAULT 4.0,
  reviews INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT product_name_length CHECK (CHAR_LENGTH(name) >= 1 AND CHAR_LENGTH(name) <= 200),
  CONSTRAINT product_description_length CHECK (CHAR_LENGTH(description) >= 1 AND CHAR_LENGTH(description) <= 1000),
  CONSTRAINT product_price_positive CHECK (price >= 0),
  CONSTRAINT product_discount_range CHECK (discount >= 0 AND discount <= 100),
  CONSTRAINT product_stock_positive CHECK (stock >= 0),
  CONSTRAINT product_rating_range CHECK (rating >= 0 AND rating <= 5),
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_is_active (is_active),
  INDEX idx_products_is_featured (is_featured),
  INDEX idx_products_stock (stock),
  INDEX idx_products_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger to calculate final price for products
DELIMITER //
CREATE TRIGGER IF NOT EXISTS calculate_product_final_price
BEFORE INSERT ON products
FOR EACH ROW
BEGIN
  SET NEW.final_price = NEW.price - (NEW.price * NEW.discount / 100);
END//

CREATE TRIGGER IF NOT EXISTS calculate_product_final_price_update
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
  SET NEW.final_price = NEW.price - (NEW.price * NEW.discount / 100);
END//

-- Trigger to generate slug from category name
CREATE TRIGGER IF NOT EXISTS generate_category_slug
BEFORE INSERT ON categories
FOR EACH ROW
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SET NEW.slug = LOWER(REGEXP_REPLACE(TRIM(NEW.name), '[^a-zA-Z0-9]+', '-'));
    SET NEW.slug = TRIM(BOTH '-' FROM NEW.slug);
  END IF;
END//

CREATE TRIGGER IF NOT EXISTS generate_category_slug_update
BEFORE UPDATE ON categories
FOR EACH ROW
BEGIN
  IF NEW.name != OLD.name OR NEW.slug IS NULL OR NEW.slug = '' THEN
    SET NEW.slug = LOWER(REGEXP_REPLACE(TRIM(NEW.name), '[^a-zA-Z0-9]+', '-'));
    SET NEW.slug = TRIM(BOTH '-' FROM NEW.slug);
  END IF;
END//

DELIMITER ;
