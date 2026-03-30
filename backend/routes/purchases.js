// routes/purchases.js - Storico acquisti da privati

const express = require('express');
const router = express.Router();

// GET /purchases
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { limit = 50 } = req.query;
  const purchases = db.prepare(
    'SELECT * FROM purchases ORDER BY created_at DESC LIMIT ?'
  ).all(parseInt(limit));

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(prezzo) as totale_speso,
      SUM(CASE WHEN tipo_pag='cash' THEN 1 ELSE 0 END) as cash_count,
      SUM(CASE WHEN tipo_pag='voucher' THEN 1 ELSE 0 END) as voucher_count,
      AVG(prezzo) as prezzo_medio
    FROM purchases
  `).get();

  res.json({ data: purchases, stats, total: purchases.length });
});

// GET /purchases/analytics
router.get('/analytics', (req, res) => {
  const db = req.app.locals.db;

  const byDay = db.prepare(`
    SELECT
      date(created_at) as day,
      COUNT(*) as count,
      SUM(prezzo) as total
    FROM purchases
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY day
    ORDER BY day
  `).all();

  const byBrand = db.prepare(`
    SELECT brand, COUNT(*) as count, SUM(prezzo) as total
    FROM purchases
    GROUP BY brand ORDER BY count DESC LIMIT 6
  `).all();

  res.json({ byDay, byBrand });
});

module.exports = router;
