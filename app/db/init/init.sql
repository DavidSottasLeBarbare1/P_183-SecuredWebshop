-- =============================================================
-- Base de données du webshop
-- =============================================================
-- ATTENTION : Ce fichier contient volontairement des failles
-- de sécurité à corriger dans le cadre du projet.
-- =============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS webshop
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE webshop;

-- ---------------------------------------------------------------
-- Table users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'user',
    address    VARCHAR(255),
    photo_path VARCHAR(255)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- Table products
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    price       DECIMAL(10, 2) NOT NULL,
    image_url   VARCHAR(500)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- Table refresh_tokens
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    token      VARCHAR(512) NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- ---------------------------------------------------------------
-- Données de départ
-- ---------------------------------------------------------------
INSERT INTO users (username, email, password, role, address) VALUES
    ('admin',  'admin@webshop.com', 'admin123',  'admin', '1 Rue de la Paix, 1000 Lausanne'),
    ('alice',  'alice@webshop.com', 'password1', 'user',  '42 Avenue des Alpes, 1200 Genève');

INSERT INTO products (name, description, price, image_url) VALUES
    (
        'Casque Audio Pro X1',
        'Un casque confortable et moderne, parfait pour demarrer une vitrine produit.',
        89.00,
        'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=600&q=80'
    );
