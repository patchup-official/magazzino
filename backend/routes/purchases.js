// routes/purchases.js

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { query, get } = req.app.locals;
  const { limit = 50 } = req.query;
  const purchases = query('SELECT * FROM purchases ORDER BY created_at DESC LIMIT ?', [parseInt(limit)]);
  const stats = get(`SELECT COUNT(*) as total, SUM(prezzo) as totale_speso,
    SUM(CASE WHEN tipo_pag='cash' THEN 1 ELSE 0 END) as cash_count,
    SUM(CASE WHEN tipo_pag='voucher' THEN 1 ELSE 0 END) as voucher_count
    FROM purchases`);
  res.json({ data: purchases, stats, total: purchases.length });
});

router.get('/analytics', (req, res) => {
  const { query } = req.app.locals;
  const byBrand = query(`SELECT brand, COUNT(*) as count, SUM(prezzo) as total
    FROM purchases GROUP BY brand ORDER BY count DESC LIMIT 6`);
  res.json({ byBrand });
});

module.exports = router;
