-- ============================================
-- Vishalini Fireworks Database
-- For XAMPP/phpMyAdmin Import
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create database (comment out if importing directly to existing database)
CREATE DATABASE IF NOT EXISTS `vishalini_fireworks` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `vishalini_fireworks`;

-- ============================================
-- Table: users
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `username` VARCHAR(30) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: categories
-- ============================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT '',
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `global_discount` DECIMAL(5,2) DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_categories_is_active` (`is_active`),
  KEY `idx_categories_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: products
-- ============================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` CHAR(36) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(5,2) DEFAULT 0.00,
  `final_price` DECIMAL(10,2) DEFAULT 0.00,
  `content` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT '',
  `images` JSON DEFAULT NULL,
  `features` JSON DEFAULT NULL,
  `stock` INT DEFAULT 0,
  `low_stock_threshold` INT DEFAULT 10,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_featured` TINYINT(1) DEFAULT 0,
  `rating` DECIMAL(2,1) DEFAULT 4.0,
  `reviews` INT DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_category` (`category_id`),
  KEY `idx_products_is_active` (`is_active`),
  KEY `idx_products_is_featured` (`is_featured`),
  KEY `idx_products_stock` (`stock`),
  KEY `idx_products_sort_order` (`sort_order`),
  CONSTRAINT `fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Triggers
-- ============================================

-- Trigger: Calculate final price on INSERT
DELIMITER $$
DROP TRIGGER IF EXISTS `calculate_product_final_price`$$
CREATE TRIGGER `calculate_product_final_price`
BEFORE INSERT ON `products`
FOR EACH ROW
BEGIN
  SET NEW.final_price = NEW.price - (NEW.price * NEW.discount / 100);
END$$
DELIMITER ;

-- Trigger: Calculate final price on UPDATE
DELIMITER $$
DROP TRIGGER IF EXISTS `calculate_product_final_price_update`$$
CREATE TRIGGER `calculate_product_final_price_update`
BEFORE UPDATE ON `products`
FOR EACH ROW
BEGIN
  SET NEW.final_price = NEW.price - (NEW.price * NEW.discount / 100);
END$$
DELIMITER ;

-- Trigger: Generate slug on INSERT
DELIMITER $$
DROP TRIGGER IF EXISTS `generate_category_slug`$$
CREATE TRIGGER `generate_category_slug`
BEFORE INSERT ON `categories`
FOR EACH ROW
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SET NEW.slug = LOWER(REPLACE(TRIM(NEW.name), ' ', '-'));
    SET NEW.slug = REGEXP_REPLACE(NEW.slug, '[^a-z0-9-]', '');
    SET NEW.slug = REGEXP_REPLACE(NEW.slug, '-+', '-');
    SET NEW.slug = TRIM(BOTH '-' FROM NEW.slug);
  END IF;
END$$
DELIMITER ;

-- Trigger: Generate slug on UPDATE
DELIMITER $$
DROP TRIGGER IF EXISTS `generate_category_slug_update`$$
CREATE TRIGGER `generate_category_slug_update`
BEFORE UPDATE ON `categories`
FOR EACH ROW
BEGIN
  IF NEW.name != OLD.name OR NEW.slug IS NULL OR NEW.slug = '' THEN
    SET NEW.slug = LOWER(REPLACE(TRIM(NEW.name), ' ', '-'));
    SET NEW.slug = REGEXP_REPLACE(NEW.slug, '[^a-z0-9-]', '');
    SET NEW.slug = REGEXP_REPLACE(NEW.slug, '-+', '-');
    SET NEW.slug = TRIM(BOTH '-' FROM NEW.slug);
  END IF;
END$$
DELIMITER ;

-- ============================================
-- Sample Data (Optional - Comment out if not needed)
-- ============================================

-- Insert default admin user (password: admin123)
-- Note: This is a bcrypt hashed version of 'admin123'
INSERT INTO `users` (`id`, `username`, `password`, `role`, `is_active`) VALUES
(UUID(), 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq7dQw9.G', 'admin', 1);

-- Sample categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `sort_order`, `is_active`) VALUES
(UUID(), 'Sparklers', 'sparklers', 'Beautiful sparklers for celebrations', 1, 1),
(UUID(), 'Crackers', 'crackers', 'Traditional firecrackers', 2, 1),
(UUID(), 'Fountains', 'fountains', 'Ground fountains and spinners', 3, 1),
(UUID(), 'Rockets', 'rockets', 'Sky rockets and aerial fireworks', 4, 1),
(UUID(), 'Gift Boxes', 'gift-boxes', 'Special gift box collections', 5, 1);

COMMIT;

-- ============================================
-- Import Instructions:
--
-- 1. Open XAMPP Control Panel and start Apache and MySQL
-- 2. Open phpMyAdmin (http://localhost/phpmyadmin)
-- 3. Click on "Import" tab
-- 4. Choose this SQL file
-- 5. Click "Go" button
--
-- OR
--
-- 1. Create a new database named 'vishalini_fireworks'
-- 2. Select the database
-- 3. Click "Import" and upload this file
--
-- Default Admin Credentials:
-- Username: admin
-- Password: admin123
--
-- IMPORTANT: Change the admin password after first login!
-- ============================================
