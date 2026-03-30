// routes/products.js

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { query, get } = req.app.locals;
  const { categoria, search } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [], conds = [];
  if (categoria) { conds.push('categoria = ?'); params.push(categoria); }
  if (search)    { conds.push('nome LIKE ?');   params.push('%'+search+'%'); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const products = query(sql, params);
  res.json({ data: products, total: products.length });
});

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals;
  const { nome, categoria, qty = 0, prezzo_acq = 0, prezzo_vend = 0 } = req.body;
  if (!nome || !categoria) return res.status(400).json({ error: 'nome e categoria obbligatori' });
  const id = uid();
  run(`INSERT INTO products (id, nome, categoria, qty, prezzo_acq, prezzo_vend)
       VALUES (?, ?, ?, ?, ?, ?)`, [id, nome, categoria, qty, prezzo_acq, prezzo_vend]);
  res.status(201).json(get('SELECT * FROM products WHERE id = ?', [id]));
});

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  const { nome, categoria, qty, prezzo_acq, prezzo_vend } = req.body;
  if (!get('SELECT id FROM products WHERE id = ?', [req.params.id]))
    return res.status(404).json({ error: 'Prodotto non trovato' });
  run(`UPDATE products SET nome=?, categoria=?, qty=?, prezzo_acq=?, prezzo_vend=? WHERE id=?`,
      [nome, categoria, qty, prezzo_acq, prezzo_vend, req.params.id]);
  res.json(get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  if (!get('SELECT id FROM products WHERE id = ?', [req.params.id]))
    return res.status(404).json({ error: 'Prodotto non trovato' });
  run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Eliminato' });
});

module.exports = router;
