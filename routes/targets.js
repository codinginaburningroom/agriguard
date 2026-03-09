// backend/routes/targets.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', async (req, res) => {
  const [r] = await db.query('SELECT * FROM targets ORDER BY target_name_th');
  res.json({ success: true, data: r });
});
router.get('/:id', async (req, res) => {
  const [r] = await db.query('SELECT * FROM targets WHERE target_id=?', [req.params.id]);
  if (!r.length) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: r[0] });
});
router.get('/:id/products', async (req, res) => {
  const [r] = await db.query(`
    SELECT p.*,mg.moa_code,mg.moa_name_th,mg.classification_system,mg.resistance_risk,pt.efficacy_rating
    FROM product_targets pt
    JOIN products p ON pt.product_id=p.product_id
    JOIN moa_groups mg ON p.moa_group_id=mg.moa_group_id
    WHERE pt.target_id=? ORDER BY pt.efficacy_rating DESC`, [req.params.id]);
  res.json({ success: true, data: r });
});
module.exports = router;
