const express = require('express');
const router = express.Router();
const FONEDAY_BASE = 'https://foneday.shop/api/v1';

function fonedayHeaders() {
  return { 'Authorization': `Bearer ${process.env.FONEDAY_TOKEN||''}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
}

let productsCache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function getProducts() {
  const now = Date.now();
  if (productsCache && (now - cacheTime) < CACHE_TTL) return productsCache;
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(`${FONEDAY_BASE}/products`, { headers: fonedayHeaders() });
  if (!res.ok) throw new Error(`Foneday products error: ${res.status}`);
  const data = await res.json();
  productsCache = data.products || [];
  cacheTime = now;
  return productsCache;
}

router.get('/search', async (req, res) => {
  try {
    const { q = '', instock } = req.query;
    if (!q || q.trim().length < 2) return res.json({ products: [] });
    const products = await getProducts();
    const terms = q.toLowerCase().split(/\\s+/).filter(Boolean);
    let results = products.filter(p => {
      const hay = [p.title,p.suitable_for,p.category,p.model_brand,p.quality,...(p.model_codes||[])].join(' ').toLowerCase();
      return terms.every(t => hay.includes(t));
    });
    if (instock === 'true') results = results.filter(p => p.instock === 'Y');
    results.sort((a,b) => {
      if (a.instock==='Y' && b.instock!=='Y') return -1;
      if (a.instock!=='Y' && b.instock==='Y') return 1;
      return (a.price||0)-(b.price||0);
    });
    res.json({ products: results.slice(0,30), total: results.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/cart/add', async (req, res) => {
  try {
    const { articles } = req.body;
    if (!Array.isArray(articles)||!articles.length) return res.status(400).json({ error: 'articles richiesto' });
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(`${FONEDAY_BASE}/shopping-cart-add-items`, { method:'POST', headers:fonedayHeaders(), body:JSON.stringify({articles}) });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(`${FONEDAY_BASE}/orders`, { headers: fonedayHeaders() });
    res.json(await r.json());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/cache/refresh', async (req, res) => {
  productsCache = null; cacheTime = 0;
  try { const p = await getProducts(); res.json({ ok:true, count:p.length }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = { router };
