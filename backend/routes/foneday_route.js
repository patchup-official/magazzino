const express = require('express');
const router = express.Router();
const FONEDAY_BASE = 'https://foneday.shop/api/v1';

function getToken() { return process.env.FONEDAY_TOKEN || ''; }
function fonedayHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// Cache prodotti in memoria (1 ora)
let productsCache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function getProducts() {
  const now = Date.now();
  if (productsCache && (now - cacheTime) < CACHE_TTL) return productsCache;
  const res = await fetch(`${FONEDAY_BASE}/products`, { headers: fonedayHeaders() });
  if (!res.ok) throw new Error(`Foneday error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  productsCache = data.products || [];
  cacheTime = now;
  return productsCache;
}

// GET /foneday/search?q=...&instock=true
router.get('/search', async (req, res) => {
  try {
    const { q = '', instock } = req.query;
    if (!q || q.trim().length < 2) return res.json({ products: [] });
    const products = await getProducts();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let results = products.filter(p => {
      const hay = [p.title, p.suitable_for, p.category, p.model_brand, p.quality, ...(p.model_codes||[])].join(' ').toLowerCase();
      return terms.every(t => hay.includes(t));
    });
    if (instock === 'true') results = results.filter(p => p.instock === 'Y');
    results.sort((a, b) => {
      if (a.instock === 'Y' && b.instock !== 'Y') return -1;
      if (a.instock !== 'Y' && b.instock === 'Y') return 1;
      return (a.price||0) - (b.price||0);
    });
    res.json({ products: results.slice(0, 30), total: results.length });
  } catch (e) {
    console.error('Foneday search error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /foneday/cart/add
router.post('/cart/add', async (req, res) => {
  try {
    const { articles } = req.body;
    if (!Array.isArray(articles) || articles.length === 0)
      return res.status(400).json({ error: 'articles richiesto' });
    const fonRes = await fetch(`${FONEDAY_BASE}/shopping-cart-add-items`, {
      method: 'POST',
      headers: fonedayHeaders(),
      body: JSON.stringify({ articles }),
    });
    const data = await fonRes.json();
    if (!fonRes.ok) return res.status(fonRes.status).json(data);
    res.json(data);
  } catch (e) {
    console.error('Foneday cart error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /foneday/orders
router.get('/orders', async (req, res) => {
  try {
    const r = await fetch(`${FONEDAY_BASE}/orders`, { headers: fonedayHeaders() });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /foneday/cache/refresh
router.get('/cache/refresh', async (req, res) => {
  productsCache = null; cacheTime = 0;
  try {
    const products = await getProducts();
    res.json({ ok: true, count: products.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = { router };
