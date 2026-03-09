// backend/routes/farms.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  const [r] = await db.query('SELECT * FROM farms WHERE user_id=? ORDER BY created_at DESC', [req.user.user_id]);
  res.json({ success: true, data: r });
});
router.get('/:id', async (req, res) => {
  const [r] = await db.query('SELECT * FROM farms WHERE farm_id=? AND user_id=?', [req.params.id, req.user.user_id]);
  if (!r.length) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: r[0] });
});
router.post('/', async (req, res) => {
  try {
    const { farm_name, location, total_area, province, district } = req.body;
    if (!farm_name) return res.status(400).json({ success: false, error: 'farm_name required' });
    const [r] = await db.query(
      'INSERT INTO farms (user_id,farm_name,location,total_area,province,district) VALUES (?,?,?,?,?,?)',
      [req.user.user_id, farm_name, location||null, total_area||null, province||null, district||null]);
    res.status(201).json({ success: true, data: { farm_id: r.insertId, farm_name } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.put('/:id', async (req, res) => {
  const { farm_name, location, total_area, province, district } = req.body;
  await db.query('UPDATE farms SET farm_name=?,location=?,total_area=?,province=?,district=? WHERE farm_id=? AND user_id=?',
    [farm_name, location, total_area, province, district, req.params.id, req.user.user_id]);
  res.json({ success: true });
});
router.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM farms WHERE farm_id=? AND user_id=?', [req.params.id, req.user.user_id]);
  res.json({ success: true });
});
router.get('/:id/plots', async (req, res) => {
  const [r] = await db.query('SELECT * FROM plots WHERE farm_id=? ORDER BY plot_name', [req.params.id]);
  res.json({ success: true, data: r });
});
module.exports = router;
