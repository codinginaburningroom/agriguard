// backend/routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');

const sign = (user) => jwt.sign(
  { user_id: user.user_id, username: user.username, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name, phone } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, error: 'username, email, password required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, error: 'Password min 6 chars' });

    const [dup] = await db.query(
      'SELECT user_id FROM users WHERE username=? OR email=?', [username, email]);
    if (dup.length) return res.status(409).json({ success: false, error: 'Username or email already taken' });

    const hash = await bcrypt.hash(password, 10);
    const [r]  = await db.query(
      'INSERT INTO users (username,email,password_hash,full_name,phone,role) VALUES (?,?,?,?,?,?)',
      [username, email, hash, full_name||null, phone||null, 'user']
    );
    const userData = { user_id: r.insertId, username, email, full_name: full_name||null, role: 'user' };
    res.status(201).json({ success: true, data: userData, token: sign(userData) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: 'username and password required' });

    const [rows] = await db.query(
      'SELECT * FROM users WHERE username=? OR email=?', [username, username]);
    if (!rows.length) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const u = rows[0];
    if (!u.is_active) return res.status(403).json({ success: false, error: 'Account disabled' });
    if (!await bcrypt.compare(password, u.password_hash))
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    await db.query('UPDATE users SET last_login=NOW() WHERE user_id=?', [u.user_id]);
    const userData = { user_id: u.user_id, username: u.username, email: u.email, full_name: u.full_name, role: u.role };
    res.json({ success: true, data: userData, token: sign(u) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/auth/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const [r] = await db.query(
      'SELECT user_id,username,email,full_name,phone,role,created_at,last_login FROM users WHERE user_id=?',
      [req.user.user_id]);
    if (!r.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r[0] });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, phone, email } = req.body;
    await db.query('UPDATE users SET full_name=?,phone=?,email=? WHERE user_id=?',
      [full_name, phone, email, req.user.user_id]);
    res.json({ success: true, message: 'Updated' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [r] = await db.query('SELECT password_hash FROM users WHERE user_id=?', [req.user.user_id]);
    if (!await bcrypt.compare(current_password, r[0].password_hash))
      return res.status(400).json({ success: false, error: 'Current password wrong' });
    await db.query('UPDATE users SET password_hash=? WHERE user_id=?',
      [await bcrypt.hash(new_password, 10), req.user.user_id]);
    res.json({ success: true, message: 'Password changed' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
