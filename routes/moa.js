// backend/routes/moa.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/groups', async (req, res) => {
  const [r] = await db.query('SELECT * FROM moa_groups ORDER BY moa_code');
  res.json({ success: true, data: r });
});
router.get('/groups/system/:system', async (req, res) => {
  const [r] = await db.query('SELECT * FROM moa_groups WHERE classification_system=? ORDER BY moa_code', [req.params.system]);
  res.json({ success: true, data: r });
});
router.get('/groups/for-target/:targetId', async (req, res) => {
  const [r] = await db.query(`
    SELECT DISTINCT mg.*
    FROM moa_groups mg
    JOIN products p ON mg.moa_group_id=p.moa_group_id
    JOIN product_targets pt ON p.product_id=pt.product_id
    WHERE pt.target_id=? ORDER BY mg.moa_code`, [req.params.targetId]);
  res.json({ success: true, data: r });
});
// ⭐ Core rotation check
router.get('/usage-history', async (req, res) => {
  const { plotCropId, targetId, limit=3 } = req.query;
  const [r] = await db.query(`
    SELECT al.log_id,al.application_date,ai.moa_code_snapshot,ai.product_name_snapshot
    FROM application_logs al
    JOIN application_items ai ON al.log_id=ai.log_id
    WHERE al.plot_crop_id=? AND ai.target_id=?
    ORDER BY al.application_date DESC LIMIT ?`,
    [plotCropId, targetId, parseInt(limit)]);
  res.json({ success: true, data: r });
});
router.get('/ingredients', async (req, res) => {
  const { moaCode, targetId } = req.query;
  const [r] = await db.query(`
    SELECT DISTINCT p.active_ingredient,
      AVG(pt.efficacy_rating) AS efficacy, MIN(p.phi_days) AS phi_days
    FROM products p
    JOIN moa_groups mg ON p.moa_group_id=mg.moa_group_id
    JOIN product_targets pt ON p.product_id=pt.product_id
    WHERE mg.moa_code=? AND pt.target_id=?
    GROUP BY p.active_ingredient ORDER BY efficacy DESC`,
    [moaCode, targetId]);
  res.json({ success: true, data: r });
});
module.exports = router;
