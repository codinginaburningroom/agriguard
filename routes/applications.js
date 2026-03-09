// backend/routes/applications.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.post('/logs', async (req, res) => {
  try {
    const { plot_crop_id, application_date, application_method, weather_condition, temperature, notes } = req.body;
    if (!plot_crop_id || !application_date)
      return res.status(400).json({ success: false, error: 'plot_crop_id and application_date required' });
    const [r] = await db.query(
      'INSERT INTO application_logs (plot_crop_id,application_date,application_method,weather_condition,temperature,notes) VALUES (?,?,?,?,?,?)',
      [plot_crop_id, application_date, application_method||null, weather_condition||null, temperature||null, notes||null]);
    res.status(201).json({ success: true, data: { log_id: r.insertId } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/items', async (req, res) => {
  try {
    const { log_id, product_id, target_id, rate_used, rate_unit, water_volume, moa_code_snapshot, product_name_snapshot } = req.body;
    if (!log_id || !product_id || !target_id)
      return res.status(400).json({ success: false, error: 'log_id, product_id, target_id required' });
    const [r] = await db.query(
      'INSERT INTO application_items (log_id,product_id,target_id,rate_used,rate_unit,water_volume,moa_code_snapshot,product_name_snapshot) VALUES (?,?,?,?,?,?,?,?)',
      [log_id, product_id, target_id, rate_used||null, rate_unit||null, water_volume||null, moa_code_snapshot, product_name_snapshot]);
    res.status(201).json({ success: true, data: { item_id: r.insertId } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/logs/:logId/items', async (req, res) => {
  const [r] = await db.query(`
    SELECT ai.*,p.product_name,p.active_ingredient,t.target_name_th
    FROM application_items ai
    JOIN products p ON ai.product_id=p.product_id
    JOIN targets t ON ai.target_id=t.target_id
    WHERE ai.log_id=?`, [req.params.logId]);
  res.json({ success: true, data: r });
});
module.exports = router;
