// backend/routes/products.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', async (req, res) => {
  const [r] = await db.query(`
    SELECT p.*,mg.moa_code,mg.moa_name_th,mg.classification_system,mg.resistance_risk
    FROM products p JOIN moa_groups mg ON p.moa_group_id=mg.moa_group_id ORDER BY p.product_name`);
  res.json({ success: true, data: r });
});
router.get('/by-ingredient', async (req, res) => {
  const { ingredient, targetId } = req.query;
  const [r] = await db.query(`
    SELECT p.*,mg.moa_code,mg.moa_name_th
    FROM products p JOIN moa_groups mg ON p.moa_group_id=mg.moa_group_id
    JOIN product_targets pt ON pt.product_id=p.product_id
    WHERE p.active_ingredient=? AND pt.target_id=?`, [ingredient, targetId]);
  res.json({ success: true, data: r });
});
module.exports = router;
