// backend/routes/search.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { q='', type='all' } = req.query;
    if (!q.trim()) return res.json({ success: true, data: { pests:[], products:[] } });
    const p = `%${q}%`;
    const result = {};

    if (type==='all' || type==='pest') {
      // ค้นหา pest/disease
      const [pests] = await db.query(`
        SELECT t.*, COUNT(DISTINCT pt.product_id) AS product_count
        FROM targets t
        LEFT JOIN product_targets pt ON pt.target_id = t.target_id
        WHERE (t.target_name_th LIKE ? OR t.target_name_en LIKE ? OR t.scientific_name LIKE ?)
              AND t.target_type IN ('insect', 'disease', 'mite')
        GROUP BY t.target_id LIMIT 20`, [p,p,p]);

      // โหลด products สำหรับแต่ละ pest
      for (const pest of pests) {
        const [prods] = await db.query(`
          SELECT p.product_id, p.product_name, p.active_ingredient, p.company,
                 p.moa_group_id, mg.moa_code, mg.moa_name_th, pt.efficacy_rating
          FROM product_targets pt
          JOIN products p   ON pt.product_id = p.product_id
          JOIN moa_groups mg ON p.moa_group_id = mg.moa_group_id
          WHERE pt.target_id = ?
          ORDER BY pt.efficacy_rating DESC LIMIT 10`, [pest.target_id]);
        pest.products = prods;
      }
      result.pests = pests;
    }

    if (type==='all' || type==='product') {
      // ค้นหา products
      const [products] = await db.query(`
        SELECT DISTINCT p.*, mg.moa_code, mg.moa_name_th,
               mg.classification_system, mg.resistance_risk
        FROM products p
        JOIN moa_groups mg ON p.moa_group_id = mg.moa_group_id
        LEFT JOIN product_targets pt ON pt.product_id = p.product_id
        LEFT JOIN targets t ON t.target_id = pt.target_id
        WHERE p.product_name LIKE ? OR p.active_ingredient LIKE ?
           OR p.company LIKE ? OR t.target_name_th LIKE ? OR t.target_name_en LIKE ?
        LIMIT 30`, [p,p,p,p,p]);

      // โหลด targets สำหรับแต่ละ product
      for (const prod of products) {
        const [tgts] = await db.query(`
          SELECT t.target_id, t.target_name_th, t.target_name_en, t.target_type,
                 t.scientific_name, pt.efficacy_rating
          FROM product_targets pt
          JOIN targets t ON pt.target_id = t.target_id
          WHERE pt.product_id = ?
          ORDER BY pt.efficacy_rating DESC LIMIT 10`, [prod.product_id]);
        prod.targets = tgts;
      }
      result.products = products;
    }

    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
module.exports = router;