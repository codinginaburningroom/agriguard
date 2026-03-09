// backend/routes/plotCrops.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.post('/', async (req, res) => {
  const { plot_id, crop_id, planting_date, status } = req.body;
  const [r] = await db.query(
    'INSERT INTO plot_crops (plot_id,crop_id,planting_date,status) VALUES (?,?,?,?)',
    [plot_id, crop_id, planting_date||null, status||'active']);
  res.status(201).json({ success: true, data: { plot_crop_id: r.insertId } });
});
router.get('/:id/application-logs', async (req, res) => {
  const [r] = await db.query(`
    SELECT al.*,
      GROUP_CONCAT(DISTINCT ai.moa_code_snapshot)    AS moa_codes,
      GROUP_CONCAT(DISTINCT ai.product_name_snapshot) AS products,
      GROUP_CONCAT(DISTINCT t.target_name_th)         AS targets
    FROM application_logs al
    LEFT JOIN application_items ai ON ai.log_id=al.log_id
    LEFT JOIN targets t ON ai.target_id=t.target_id
    WHERE al.plot_crop_id=?
    GROUP BY al.log_id ORDER BY al.application_date DESC`, [req.params.id]);
  res.json({ success: true, data: r });
});
module.exports = router;
