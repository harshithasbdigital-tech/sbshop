-- ====================================================================
-- SB ELEVATORS STORE DATABASE SCHEMA
-- Database: u412886035_sbesdb
-- Target Server: MySQL 5.7+ / MariaDB 10.3+ (Hostinger / cPanel)
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ====================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `u412886035_sbesdb` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `u412886035_sbesdb`;

-- --------------------------------------------------------------------
-- Table structure for `parts` (Store Elevator Spare Parts Catalog)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `parts`;
CREATE TABLE `parts` (
  `id` VARCHAR(120) NOT NULL,
  `code` VARCHAR(120) NOT NULL,
  `itemCode` VARCHAR(120) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(120) DEFAULT 'Traction & Motors',
  `price` DECIMAL(12,2) DEFAULT 0.00,
  `priceUnit` VARCHAR(50) DEFAULT 'Piece',
  `unit` VARCHAR(50) DEFAULT 'Piece',
  `moq` VARCHAR(50) DEFAULT '1 Unit',
  `minOrder` INT(11) DEFAULT 1,
  `badge` VARCHAR(50) DEFAULT '',
  `inStock` TINYINT(1) DEFAULT 1,
  `stockCount` INT(11) DEFAULT 10,
  `leadTime` VARCHAR(100) DEFAULT 'Same Day Dispatch',
  `warranty` VARCHAR(100) DEFAULT '24 Months OEM Warranty',
  `compliance` VARCHAR(100) DEFAULT 'EN 81-20 / IS 14665',
  `image` MEDIUMTEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `specs` LONGTEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parts_code` (`code`),
  KEY `idx_parts_itemCode` (`itemCode`),
  KEY `idx_parts_category` (`category`),
  KEY `idx_parts_price` (`price`),
  KEY `idx_parts_inStock` (`inStock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Table structure for `quotations` (Customer RFQ Enquiries sent to sales@sbdat.com)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `quotations`;
CREATE TABLE `quotations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `recipient` VARCHAR(100) NOT NULL DEFAULT 'sales@sbdat.com',
  `partCode` VARCHAR(100) DEFAULT NULL,
  `partTitle` VARCHAR(255) DEFAULT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 1,
  `unit` VARCHAR(50) DEFAULT 'Piece',
  `unitPrice` DECIMAL(12,2) DEFAULT 0.00,
  `totalPrice` DECIMAL(12,2) DEFAULT 0.00,
  `buyerName` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('new', 'contacted', 'quoted', 'completed', 'cancelled') NOT NULL DEFAULT 'new',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quote_partCode` (`partCode`),
  KEY `idx_quote_phone` (`phone`),
  KEY `idx_quote_email` (`email`),
  KEY `idx_quote_status` (`status`),
  KEY `idx_quote_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
