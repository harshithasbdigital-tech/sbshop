<?php
/**
 * SB Elevators Central MySQL Database Connection
 * Configured for Hostinger / cPanel Production Database
 */

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'u412886035_sbesdb');
define('DB_USER', getenv('DB_USER') ?: 'u412886035_sbesname');
define('DB_PASS', getenv('DB_PASS') ?: 'Sbes2026');

/**
 * Returns active PDO database instance, or null if database is unreachable.
 * Automatically provisions tables and indexes.
 */
function getDbConnection() {
    static $pdo = null;
    static $attempted = false;

    if ($attempted) {
        return $pdo;
    }

    $attempted = true;

    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        // 1. Auto-create parts catalog table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `parts` (
                `id` VARCHAR(120) NOT NULL PRIMARY KEY,
                `code` VARCHAR(120) NOT NULL,
                `itemCode` VARCHAR(120) NULL,
                `title` VARCHAR(255) NOT NULL,
                `category` VARCHAR(120) NULL,
                `price` DECIMAL(12, 2) DEFAULT 0.00,
                `priceUnit` VARCHAR(50) DEFAULT 'Piece',
                `unit` VARCHAR(50) DEFAULT 'Piece',
                `moq` VARCHAR(50) DEFAULT '1 Unit',
                `minOrder` INT DEFAULT 1,
                `badge` VARCHAR(50) DEFAULT '',
                `inStock` TINYINT(1) DEFAULT 1,
                `stockCount` INT DEFAULT 10,
                `leadTime` VARCHAR(100) DEFAULT 'Same Day Dispatch',
                `warranty` VARCHAR(100) DEFAULT '24 Months OEM Warranty',
                `compliance` VARCHAR(100) DEFAULT 'EN 81-20 / IS 14665',
                `image` MEDIUMTEXT NULL,
                `description` TEXT NULL,
                `specs` LONGTEXT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX `idx_code` (`code`),
                INDEX `idx_category` (`category`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Ensure image column is MEDIUMTEXT to avoid base64 / URL truncation
        try {
            $pdo->exec("ALTER TABLE `parts` MODIFY COLUMN `image` MEDIUMTEXT NULL");
        } catch (Exception $ignored) {}

        // 2. Auto-create quotations table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `quotations` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `recipient` VARCHAR(100) DEFAULT 'sales@sbdat.com',
                `partCode` VARCHAR(100) NULL,
                `partTitle` VARCHAR(255) NULL,
                `quantity` INT DEFAULT 1,
                `unit` VARCHAR(50) DEFAULT 'Piece',
                `unitPrice` DECIMAL(12, 2) DEFAULT 0.00,
                `totalPrice` DECIMAL(12, 2) DEFAULT 0.00,
                `buyerName` VARCHAR(255) NOT NULL,
                `phone` VARCHAR(50) NOT NULL,
                `email` VARCHAR(100) NULL,
                `city` VARCHAR(100) NULL,
                `message` TEXT NULL,
                `ip_address` VARCHAR(50) NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        return $pdo;
    } catch (Exception $e) {
        error_log("Database connection failed: " . $e->getMessage());
        $pdo = null;
        return null;
    }
}
