-- ============================================================
-- AgriGuard — Full Schema + Seed Data
-- MySQL 8.0+   charset utf8mb4
-- ============================================================
CREATE DATABASE IF NOT EXISTS agriguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agriguard;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100),
  phone         VARCHAR(20),
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- default admin: username=admin  password=admin1234
INSERT INTO users (username,email,password_hash,full_name,role) VALUES
('admin','admin@agriguard.app',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh32',
 'ผู้ดูแลระบบ','admin');

-- ── Farms ────────────────────────────────────────────────────
CREATE TABLE farms (
  farm_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  farm_name  VARCHAR(100) NOT NULL,
  province   VARCHAR(50),
  district   VARCHAR(50),
  location   TEXT,
  total_area DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── Plots ────────────────────────────────────────────────────
CREATE TABLE plots (
  plot_id    INT AUTO_INCREMENT PRIMARY KEY,
  farm_id    INT NOT NULL,
  plot_name  VARCHAR(100) NOT NULL,
  area       DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE CASCADE
);

-- ── Crops ────────────────────────────────────────────────────
CREATE TABLE crops (
  crop_id      INT AUTO_INCREMENT PRIMARY KEY,
  crop_name_th VARCHAR(100) NOT NULL,
  crop_name_en VARCHAR(100),
  crop_type    VARCHAR(50)
);
INSERT INTO crops (crop_name_th,crop_name_en,crop_type) VALUES
('มะม่วง','Mango','fruit'),('ข้าว','Rice','grain'),('พริก','Chili','vegetable'),
('ข้าวโพด','Corn','grain'),('ทุเรียน','Durian','fruit'),('มะเขือเทศ','Tomato','vegetable'),
('ลำไย','Longan','fruit'),('มันสำปะหลัง','Cassava','tuber'),
('อ้อย','Sugarcane','cash_crop'),('ยางพารา','Rubber','cash_crop');

-- ── Plot Crops ───────────────────────────────────────────────
CREATE TABLE plot_crops (
  plot_crop_id  INT AUTO_INCREMENT PRIMARY KEY,
  plot_id       INT NOT NULL,
  crop_id       INT NOT NULL,
  planting_date DATE,
  status        ENUM('active','harvested','cancelled') DEFAULT 'active',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plot_id) REFERENCES plots(plot_id)  ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(crop_id)
);

-- ── Targets (แมลง/โรค/ไร) ───────────────────────────────────
CREATE TABLE targets (
  target_id       INT AUTO_INCREMENT PRIMARY KEY,
  target_name_th  VARCHAR(100) NOT NULL,
  target_name_en  VARCHAR(100),
  scientific_name VARCHAR(150),
  target_type     ENUM('insect','disease','mite','weed','nematode') NOT NULL,
  description     TEXT
);
INSERT INTO targets (target_name_th,target_name_en,scientific_name,target_type,description) VALUES
('เพลี้ยแป้ง','Mealybug','Pseudococcus spp.','insect','ดูดน้ำเลี้ยงจากพืช ทำให้ใบเหลืองและอ่อนแอ'),
('เพลี้ยไฟ','Thrips','Thrips spp.','insect','แมลงขนาดเล็ก ขูดกินเนื้อใบ ทำให้เกิดรอยขีดเงิน'),
('โรคแอนแทรคโนส','Anthracnose','Colletotrichum spp.','disease','เชื้อราทำให้เกิดแผลสีน้ำตาลบนใบและผล'),
('โรคราแป้ง','Powdery Mildew','Oidium spp.','disease','เชื้อราทำให้เกิดผงสีขาวบนใบ'),
('เพลี้ยกระโดดสีน้ำตาล','Brown Planthopper','Nilaparvata lugens','insect','ศัตรูข้าวที่สำคัญ ทำให้ข้าวแห้งตาย'),
('โรคไหม้ข้าว','Rice Blast','Magnaporthe oryzae','disease','เชื้อราสำคัญในข้าว ทำลายได้ทุกส่วน'),
('ไรแดง','Red Spider Mite','Tetranychus urticae','mite','ดูดน้ำเลี้ยง ทำให้ใบมีจุดสีเหลือง'),
('แมลงหวี่ขาว','Whitefly','Bemisia tabaci','insect','พาหะไวรัส ขับน้ำหวานทำให้เกิดราดำ'),
('หนอนกระทู้','Fall Armyworm','Spodoptera frugiperda','insect','ทำลายข้าวโพดอย่างรวดเร็ว'),
('โรคราน้ำค้าง','Downy Mildew','Peronosclerospora spp.','disease','ทำให้ใบมีแถบสีเหลืองขาว'),
('เพลี้ยอ่อน','Aphid','Aphis spp.','insect','ดูดน้ำเลี้ยง พาหะไวรัส'),
('โรครากเน่า','Root Rot (Phytophthora)','Phytophthora palmivora','disease','รากและโคนเน่า พบมากในฤดูฝน'),
('หนอนเจาะลำต้น','Stem Borer','Chilo suppressalis','insect','เจาะเข้าลำต้น ทำให้ยอดเหี่ยว'),
('เพลี้ยหอย','Scale Insect','Coccidae spp.','insect','มีเปลือกแข็ง ดูดน้ำเลี้ยงบนกิ่ง');

-- ── MOA Groups ───────────────────────────────────────────────
CREATE TABLE moa_groups (
  moa_group_id          INT AUTO_INCREMENT PRIMARY KEY,
  classification_system VARCHAR(10) NOT NULL,
  moa_code              VARCHAR(20) NOT NULL UNIQUE,
  moa_name_th           VARCHAR(150),
  moa_name_en           VARCHAR(150),
  resistance_risk       ENUM('low','medium','high') DEFAULT 'medium'
);
INSERT INTO moa_groups (classification_system,moa_code,moa_name_th,moa_name_en,resistance_risk) VALUES
('IRAC','1A','ออร์กาโนฟอสเฟต','Organophosphates','medium'),
('IRAC','1B','คาร์บาเมต','Carbamates','medium'),
('IRAC','3A','ไพรีทรอยด์','Pyrethroids','high'),
('IRAC','4A','นีโอนิโคตินอยด์','Neonicotinoids','high'),
('IRAC','4C','ซัลฟอกซิมีน','Sulfoximines','medium'),
('IRAC','5','สปินโนซิน','Spinosyns','low'),
('IRAC','6','อาเวอร์เมคติน','Avermectins','low'),
('IRAC','9','ไพเมโทรซีน','Selective Homopteran Feeding','low'),
('IRAC','22','อินดอกซาคาร์บ','Oxadiazines','medium'),
('IRAC','28','ไดอาไมด์','Diamides','high'),
('IRAC','29','ฟลอนิคาไมด์','Chordotonal Modulators','low'),
('IRAC','21','METI อาคาริไซด์','METI Acaricides','high'),
('IRAC','25','เตตรอนิค','Tetronics','low'),
('FRAC','3','DMI ฟังกิไซด์','DMI Fungicides','high'),
('FRAC','7','SDHI ฟังกิไซด์','SDHI Fungicides','high'),
('FRAC','11','QoI สตรอบิลูริน','QoI Strobilurin','high'),
('FRAC','M','มัลติไซต์ คอนแทค','Multi-site Contact','low'),
('FRAC','4','ฟีนิลอาไมด์','Phenylamides','high'),
('FRAC','40','คาร์บอกซิลิก แอซิด','Carboxylic Acids','medium');

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE products (
  product_id           INT AUTO_INCREMENT PRIMARY KEY,
  product_name         VARCHAR(150) NOT NULL,
  active_ingredient    VARCHAR(150),
  moa_group_id         INT,
  company              VARCHAR(100),
  product_type         ENUM('insecticide','fungicide','acaricide','herbicide','other') NOT NULL,
  concentration        VARCHAR(50),
  recommended_rate_min DECIMAL(8,2),
  recommended_rate_max DECIMAL(8,2),
  rate_unit            VARCHAR(30),
  phi_days             INT,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moa_group_id) REFERENCES moa_groups(moa_group_id)
);
INSERT INTO products (product_name,active_ingredient,moa_group_id,company,product_type,concentration,recommended_rate_min,recommended_rate_max,rate_unit,phi_days) VALUES
('Confidor 70% WG','Imidacloprid',4,'Bayer','insecticide','70% WG',0.5,1.0,'g/20L',7),
('Actara 25% WG','Thiamethoxam',4,'Syngenta','insecticide','25% WG',0.4,0.6,'g/20L',7),
('Coragen 20% SC','Chlorantraniliprole',10,'FMC','insecticide','20% SC',5.0,8.0,'ml/20L',1),
('Success 12% SC','Spinosad',6,'Corteva','insecticide','12% SC',10.0,15.0,'ml/20L',1),
('Karate 5% EC','Lambda-cyhalothrin',3,'Syngenta','insecticide','5% EC',10.0,15.0,'ml/20L',7),
('Lorsban 40% EC','Chlorpyrifos',1,'Corteva','insecticide','40% EC',30.0,40.0,'ml/20L',14),
('Vertimec 1.8% EC','Abamectin',7,'Syngenta','acaricide','1.8% EC',10.0,20.0,'ml/20L',3),
('Chess 50% WG','Pymetrozine',9,'Syngenta','insecticide','50% WG',5.0,8.0,'g/20L',3),
('Amistar 25% SC','Azoxystrobin',16,'Syngenta','fungicide','25% SC',15.0,20.0,'ml/20L',3),
('Folicur 25% EW','Tebuconazole',14,'Bayer','fungicide','25% EW',15.0,20.0,'ml/20L',14),
('Score 25% EC','Difenoconazole',14,'Syngenta','fungicide','25% EC',10.0,15.0,'ml/20L',7),
('Cantus 52.5% WG','Boscalid',15,'BASF','fungicide','52.5% WG',8.0,10.0,'g/20L',7),
('Dithane 80% WP','Mancozeb',17,'Corteva','fungicide','80% WP',30.0,40.0,'g/20L',5),
('Ridomil Gold 45% WP','Mefenoxam',18,'Syngenta','fungicide','45% WP',15.0,20.0,'g/20L',7),
('Benevia 10% OD','Cyantraniliprole',10,'FMC','insecticide','10% OD',10.0,15.0,'ml/20L',3),
('Radiant 12% SC','Spinetoram',6,'Corteva','insecticide','12% SC',8.0,12.0,'ml/20L',1),
('Transform 24% SC','Sulfoxaflor',5,'Corteva','insecticide','24% SC',5.0,8.0,'ml/20L',7),
('Masai 20% EC','Tebufenpyrad',12,'BASF','acaricide','20% EC',15.0,20.0,'ml/20L',7),
('Flint 50% WG','Trifloxystrobin',16,'Bayer','fungicide','50% WG',5.0,8.0,'g/20L',3),
('Acrobat 50% WP','Dimethomorph',19,'BASF','fungicide','50% WP',15.0,20.0,'g/20L',3);

-- ── Product Targets ──────────────────────────────────────────
CREATE TABLE product_targets (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT NOT NULL,
  target_id       INT NOT NULL,
  efficacy_rating TINYINT,
  UNIQUE KEY uq_pt (product_id,target_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (target_id)  REFERENCES targets(target_id)  ON DELETE CASCADE
);
INSERT INTO product_targets (product_id,target_id,efficacy_rating) VALUES
(1,1,4),(1,2,4),(1,8,5),(1,11,5),
(2,5,5),(2,11,4),(2,8,4),
(3,9,5),(3,13,5),(3,2,3),
(4,9,4),(4,2,4),
(5,1,3),(5,2,3),(5,9,3),
(6,1,3),(6,13,4),
(7,7,5),(7,2,4),
(8,5,5),(8,8,4),
(9,3,4),(9,4,3),(9,10,4),
(10,3,5),(10,4,5),
(11,3,4),(11,4,4),
(12,3,4),(12,10,4),
(13,3,3),(13,10,3),(13,12,3),
(14,10,5),(14,12,5),
(15,2,4),(15,8,4),(15,9,4),
(16,9,4),(16,2,4),
(17,8,5),(17,11,5),(17,5,4),
(18,7,5),
(19,3,4),(19,4,5),
(20,10,5),(20,12,4);

-- ── Application Logs ─────────────────────────────────────────
CREATE TABLE application_logs (
  log_id             INT AUTO_INCREMENT PRIMARY KEY,
  plot_crop_id       INT NOT NULL,
  application_date   DATE NOT NULL,
  application_method VARCHAR(50),
  weather_condition  VARCHAR(50),
  temperature        DECIMAL(4,1),
  notes              TEXT,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plot_crop_id) REFERENCES plot_crops(plot_crop_id) ON DELETE CASCADE
);

-- ── Application Items ────────────────────────────────────────
CREATE TABLE application_items (
  item_id               INT AUTO_INCREMENT PRIMARY KEY,
  log_id                INT NOT NULL,
  product_id            INT NOT NULL,
  target_id             INT NOT NULL,
  rate_used             DECIMAL(8,2),
  rate_unit             VARCHAR(30),
  water_volume          DECIMAL(8,2),
  moa_code_snapshot     VARCHAR(20)  NOT NULL,
  product_name_snapshot VARCHAR(150) NOT NULL,
  FOREIGN KEY (log_id)    REFERENCES application_logs(log_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (target_id)  REFERENCES targets(target_id)
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_farms_user     ON farms(user_id);
CREATE INDEX idx_logs_plotcrop  ON application_logs(plot_crop_id);
CREATE INDEX idx_logs_date      ON application_logs(application_date);
CREATE INDEX idx_items_log      ON application_items(log_id);
CREATE INDEX idx_items_moa_snap ON application_items(moa_code_snapshot);
