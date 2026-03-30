// routes/products.js - CRUD Prodotti

const express = require('express');
const router = express.Router();

// GET /products
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { categoria, search } = req.query;

  let query = 'SELECT * FROM products';
  const params = [];
  const conditions = [];

  if (categoria) {
    conditions.push('categoria = ?');
    params.push(categoria);
  }
  if (search) {
    conditions.push('nome LIKE ?');
    params.push(`%${search}%`);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  const products = db.prepare(query).all(...params);
  res.json({ data: products, total: products.length });
});

// POST /products
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const uid = req.app.locals.uid;
  const { nome, categoria, qty = 0, prezzo_acq = 0, prezzo_vend = 0 } = req.body;

  if (!nome || !categoria) {
    return res.status(400).json({ error: 'nome e categoria sono obbligatori' });
  }

  const id = uid();
  db.prepare(`
    INSERT INTO products (id, nome, categoria, qty, prezzo_acq, prezzo_vend)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, nome, categoria, qty, prezzo_acq, prezzo_vend);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(product);
});

// PUT /products/:id
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { nome, categoria, qty, prezzo_acq, prezzo_vend } = req.body;

  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Prodotto non trovato' });

  db.prepare(`
    UPDATE products SET nome=?, categoria=?, qty=?, prezzo_acq=?, prezzo_vend=?
    WHERE id=?
  `).run(nome, categoria, qty, prezzo_acq, prezzo_vend, req.params.id);

  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

// DELETE /products/:id
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Prodotto non trovato' });
  res.json({ message: 'Prodotto eliminato' });
});

module.exports = router;
