// backend/routes/crops.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', async (req, res) => {
  const [r] = await db.query('SELECT * FROM crops ORDER BY crop_name_th');
  res.json({ success: true, data: r });
});
module.exports = router;
