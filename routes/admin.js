// backend/routes/admin.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

// GET /api/admin/dashboard  – summary stats
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ total_users }]]  = await db.query("SELECT COUNT(*) AS total_users  FROM users WHERE role='user'");
    const [[{ active_users }]] = await db.query("SELECT COUNT(*) AS active_users FROM users WHERE is_active=1 AND role='user'");
    const [[{ total_farms }]]  = await db.query('SELECT COUNT(*) AS total_farms  FROM farms');
    const [[{ total_sprays }]] = await db.query('SELECT COUNT(*) AS total_sprays FROM application_logs');
    const [[{ new_7d }]]       = await db.query("SELECT COUNT(*) AS new_7d FROM users WHERE created_at>=DATE_SUB(NOW(),INTERVAL 7 DAY)");

    const [daily]  = await db.query(`
      SELECT DATE(application_date) AS date, COUNT(*) AS count
      FROM application_logs WHERE application_date>=DATE_SUB(NOW(),INTERVAL 30 DAY)
      GROUP BY DATE(application_date) ORDER BY date`);

    const [topMoA] = await db.query(`
      SELECT moa_code_snapshot AS moa_code, COUNT(*) AS cnt
      FROM application_items WHERE moa_code_snapshot IS NOT NULL
      GROUP BY moa_code_snapshot ORDER BY cnt DESC LIMIT 8`);

    const [recentUsers] = await db.query(`
      SELECT user_id,username,full_name,email,role,created_at,last_login,is_active
      FROM users ORDER BY created_at DESC LIMIT 5`);

    res.json({ success: true, data: { total_users, active_users, total_farms, total_sprays, new_7d, daily, topMoA, recentUsers } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search='', page=1, limit=20 } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const p = `%${search}%`;
    const [users] = await db.query(`
      SELECT u.user_id,u.username,u.email,u.full_name,u.role,u.is_active,u.created_at,u.last_login,
             COUNT(DISTINCT f.farm_id) AS farm_count,
             COUNT(DISTINCT al.log_id) AS spray_count
      FROM users u
      LEFT JOIN farms f ON f.user_id=u.user_id
      LEFT JOIN plots pl ON pl.farm_id=f.farm_id
      LEFT JOIN plot_crops pc ON pc.plot_id=pl.plot_id
      LEFT JOIN application_logs al ON al.plot_crop_id=pc.plot_crop_id
      WHERE u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?
      GROUP BY u.user_id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [p,p,p,parseInt(limit),offset]);
    const [[{total}]] = await db.query(
      'SELECT COUNT(*) AS total FROM users WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?',[p,p,p]);
    res.json({ success: true, data: users, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/admin/users/:id – full profile + activity
router.get('/users/:id', async (req, res) => {
  try {
    const [u] = await db.query(
      'SELECT user_id,username,email,full_name,phone,role,is_active,created_at,last_login FROM users WHERE user_id=?',
      [req.params.id]);
    if (!u.length) return res.status(404).json({ success: false, error: 'Not found' });

    const [farms] = await db.query('SELECT * FROM farms WHERE user_id=?', [req.params.id]);
    const [logs]  = await db.query(`
      SELECT al.log_id,al.application_date,f.farm_name,pl.plot_name,c.crop_name_th,
             GROUP_CONCAT(DISTINCT ai.moa_code_snapshot)    AS moa_codes,
             GROUP_CONCAT(DISTINCT ai.product_name_snapshot) AS products,
             GROUP_CONCAT(DISTINCT t.target_name_th)         AS targets
      FROM application_logs al
      JOIN plot_crops pc ON al.plot_crop_id=pc.plot_crop_id
      JOIN plots pl ON pc.plot_id=pl.plot_id
      JOIN farms f ON pl.farm_id=f.farm_id
      JOIN crops c ON pc.crop_id=c.crop_id
      LEFT JOIN application_items ai ON ai.log_id=al.log_id
      LEFT JOIN targets t ON ai.target_id=t.target_id
      WHERE f.user_id=?
      GROUP BY al.log_id ORDER BY al.application_date DESC LIMIT 30`, [req.params.id]);

    res.json({ success: true, data: { user: u[0], farms, logs } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', async (req, res) => {
  try {
    const [r] = await db.query('SELECT is_active FROM users WHERE user_id=?', [req.params.id]);
    if (!r.length) return res.status(404).json({ success: false, error: 'Not found' });
    const next = r[0].is_active ? 0 : 1;
    await db.query('UPDATE users SET is_active=? WHERE user_id=?', [next, req.params.id]);
    res.json({ success: true, is_active: !!next });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin','user'].includes(role))
      return res.status(400).json({ success: false, error: 'Invalid role' });
    await db.query('UPDATE users SET role=? WHERE user_id=?', [role, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/admin/logs – all spray logs across all users
router.get('/logs', async (req, res) => {
  try {
    const { page=1, limit=30, user_id, from_date, to_date } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = []; let where = 'WHERE 1=1';
    if (user_id)   { where += ' AND f.user_id=?';                 params.push(user_id); }
    if (from_date) { where += ' AND al.application_date>=?';       params.push(from_date); }
    if (to_date)   { where += ' AND al.application_date<=?';       params.push(to_date); }

    const [logs] = await db.query(`
      SELECT al.log_id,al.application_date,al.application_method,
             u.username,u.full_name,f.farm_name,pl.plot_name,c.crop_name_th,
             GROUP_CONCAT(DISTINCT ai.moa_code_snapshot    SEPARATOR ', ') AS moa_codes,
             GROUP_CONCAT(DISTINCT ai.product_name_snapshot SEPARATOR ', ') AS products,
             GROUP_CONCAT(DISTINCT t.target_name_th         SEPARATOR ', ') AS targets
      FROM application_logs al
      JOIN plot_crops pc ON al.plot_crop_id=pc.plot_crop_id
      JOIN plots pl ON pc.plot_id=pl.plot_id
      JOIN farms f ON pl.farm_id=f.farm_id
      JOIN users u ON f.user_id=u.user_id
      JOIN crops c ON pc.crop_id=c.crop_id
      LEFT JOIN application_items ai ON ai.log_id=al.log_id
      LEFT JOIN targets t ON ai.target_id=t.target_id
      ${where}
      GROUP BY al.log_id ORDER BY al.application_date DESC
      LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    res.json({ success: true, data: logs });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
