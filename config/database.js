// backend/config/database.js
const mysql = require('mysql2');  // ✅ ใช้ callback version ไม่ใช่ mysql2/promise
require('dotenv').config();

const callbackPool = mysql.createPool({
  host:               process.env.DB_HOST || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME || 'agriguard',
  user:               process.env.DB_USER || 'root',
  password:           process.env.DB_PASS || 'root',
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           '+07:00',
  charset:            'UTF8MB4_UNICODE_CI',
});

// ✅ event นี้ fire ได้เฉพาะ callback pool
callbackPool.on('connection', (connection) => {
  connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
  connection.query("SET time_zone = '+07:00'");
});

// ✅ แปลงเป็น promise pool — method นี้มีแค่บน callback pool
const pool = callbackPool.promise();

pool.getConnection()
  .then(async (c) => {
    const [rows] = await c.query("SHOW VARIABLES LIKE 'character_set_connection'");
    console.log('✅ MySQL connected | charset:', rows[0]?.Value);
    c.release();
  })
  .catch(e => console.error('❌ MySQL error:', e.message));

module.exports = pool;