// backend/routes/plots.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/:id', async (req, res) => {
  const [r] = await db.query('SELECT * FROM plots WHERE plot_id=?', [req.params.id]);
  if (!r.length) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: r[0] });
});
router.post('/', async (req, res) => {
  const { farm_id, plot_name, area } = req.body;
  const [r] = await db.query('INSERT INTO plots (farm_id,plot_name,area) VALUES (?,?,?)',
    [farm_id, plot_name, area||null]);
  res.status(201).json({ success: true, data: { plot_id: r.insertId, plot_name } });
});
router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM plots WHERE plot_id=?', [req.params.id]);
  res.json({ success: true });
});
router.get('/:id/crops/active', async (req, res) => {
  const [r] = await db.query(`
    SELECT pc.*,c.crop_name_th,c.crop_name_en
    FROM plot_crops pc JOIN crops c ON pc.crop_id=c.crop_id
    WHERE pc.plot_id=? AND pc.status='active' ORDER BY pc.planting_date DESC`,
    [req.params.id]);
  res.json({ success: true, data: r });
});
module.exports = router;
