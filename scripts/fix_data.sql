-- ============================================================
-- AgriGuard — Cloud MySQL import (Clever Cloud compatible)
-- ============================================================

SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
SET FOREIGN_KEY_CHECKS=0;

USE buxtiwgtabkmi6e39njb;

-- ── Users ─────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO users (username,email,password_hash,full_name,role) VALUES
('admin','admin@agriguard.app',
'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh32',
'ผู้ดูแลระบบ','admin');

-- ── Crops ─────────────────────────────────

CREATE TABLE IF NOT EXISTS crops (
  crop_id INT AUTO_INCREMENT PRIMARY KEY,
  crop_name_th VARCHAR(100),
  crop_name_en VARCHAR(100),
  crop_type VARCHAR(50)
);

INSERT INTO crops (crop_name_th,crop_name_en,crop_type) VALUES
('มะม่วง','Mango','fruit'),
('ข้าว','Rice','grain'),
('พริก','Chili','vegetable'),
('ข้าวโพด','Corn','grain'),
('ทุเรียน','Durian','fruit');

-- ── Targets ───────────────────────────────

CREATE TABLE IF NOT EXISTS targets (
  target_id INT AUTO_INCREMENT PRIMARY KEY,
  target_name_th VARCHAR(100),
  target_name_en VARCHAR(100),
  scientific_name VARCHAR(150),
  target_type ENUM('insect','disease','mite','weed','nematode'),
  description TEXT
);

INSERT INTO targets (target_name_th,target_name_en,scientific_name,target_type,description) VALUES
('เพลี้ยแป้ง','Mealybug','Pseudococcus spp.','insect','ดูดน้ำเลี้ยงจากพืช'),
('เพลี้ยไฟ','Thrips','Thrips spp.','insect','ทำให้เกิดรอยเงินบนใบ'),
('โรคแอนแทรคโนส','Anthracnose','Colletotrichum spp.','disease','เชื้อราบนใบและผล'),
('โรคราแป้ง','Powdery Mildew','Oidium spp.','disease','ผงสีขาวบนใบ'),
('ไรแดง','Red Spider Mite','Tetranychus urticae','mite','จุดสีเหลืองบนใบ');

-- ── MOA groups ────────────────────────────

CREATE TABLE IF NOT EXISTS moa_groups (
  moa_group_id INT AUTO_INCREMENT PRIMARY KEY,
  classification_system VARCHAR(10),
  moa_code VARCHAR(20),
  moa_name_th VARCHAR(150),
  moa_name_en VARCHAR(150),
  resistance_risk ENUM('low','medium','high')
);

INSERT IGNORE INTO moa_groups (classification_system,moa_code,moa_name_th,moa_name_en,resistance_risk) VALUES
('IRAC','1A','Organophosphate','Organophosphate','medium'),
('IRAC','3A','Pyrethroid','Pyrethroid','high'),
('IRAC','4A','Neonicotinoid','Neonicotinoid','high'),
('IRAC','5','Spinosyn','Spinosyn','low'),
('IRAC','6','Avermectin','Avermectin','low');

-- ── Products ──────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(150),
  active_ingredient VARCHAR(150),
  moa_group_id INT,
  company VARCHAR(100),
  product_type ENUM('insecticide','fungicide','acaricide','herbicide','other'),
  concentration VARCHAR(50),
  recommended_rate_min DECIMAL(8,2),
  recommended_rate_max DECIMAL(8,2),
  rate_unit VARCHAR(30),
  phi_days INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moa_group_id) REFERENCES moa_groups(moa_group_id)
);

INSERT INTO products (product_name,active_ingredient,moa_group_id,company,product_type,concentration,recommended_rate_min,recommended_rate_max,rate_unit,phi_days) VALUES
('Confidor 70% WG','Imidacloprid',3,'Bayer','insecticide','70% WG',0.5,1.0,'g/20L',7),
('Actara 25% WG','Thiamethoxam',3,'Syngenta','insecticide','25% WG',0.4,0.6,'g/20L',7),
('Success 12% SC','Spinosad',4,'Corteva','insecticide','12% SC',10.0,15.0,'ml/20L',1),
('Vertimec 1.8% EC','Abamectin',5,'Syngenta','acaricide','1.8% EC',10.0,20.0,'ml/20L',3);

-- ── Product targets ───────────────────────

CREATE TABLE IF NOT EXISTS product_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  target_id INT,
  efficacy_rating TINYINT,
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (target_id) REFERENCES targets(target_id)
);

INSERT INTO product_targets (product_id,target_id,efficacy_rating) VALUES
(1,1,4),
(1,2,4),
(2,1,5),
(3,2,4),
(4,5,5);

SET FOREIGN_KEY_CHECKS=1;

SELECT 'AgriGuard DB import completed' AS status;