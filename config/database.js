// backend/config/database.js
const mysql = require('mysql2');
require('dotenv').config();

// ✅ รองรับทั้ง local และ Clever Cloud
const host = process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost';
const port = process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306;
const database = process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'agriguard';
const user = process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root';
const password = process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASS || 'root';

const callbackPool = mysql.createPool({
  host: host,
  port: parseInt(port),
  database: database,
  user: user,
  password: password,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+07:00',
  charset: 'utf8mb4',
});

// set connection options
callbackPool.on('connection', (connection) => {
  connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
  connection.query("SET time_zone = '+07:00'");
});

const pool = callbackPool.promise();

// test connection
pool.getConnection()
  .then(async (c) => {
    const [rows] = await c.query("SHOW VARIABLES LIKE 'character_set_connection'");
    console.log('✅ MySQL connected | charset:', rows[0]?.Value);
    c.release();
  })
  .catch(e => console.error('❌ MySQL error:', e.message));

module.exports = pool;