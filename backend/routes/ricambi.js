// routes/ricambi.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { query } = req.app.locals;
  const { barcode, categoria } = req.query;
  let sql = `SELECT r.*, f.nome as fornitore_nome FROM ricambi r LEFT JOIN fornitori f ON r.fornitore_id=f.id`;
  const params = [], conds = [];
  if (barcode)   { conds.push('r.barcode=?');    params.push(barcode); }
  if (categoria) { conds.push('r.categoria=?');  params.push(categoria); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY r.nome ASC';
  const ricambi = query(sql, params);
  // Alert scorte basse
  const alerts = ricambi.filter(r => r.qty <= r.qty_minima);
  res.json({ data: ricambi, alerts, total: ricambi.length });
});

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals;
  const { nome, categoria, compatibile, fornitore_id, qty=0, qty_minima=1, prezzo_acq=0, barcode, note } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obbligatorio' });
  const id = uid();
  try {
    run(`INSERT INTO ricambi (id,nome,categoria,compatibile,fornitore_id,qty,qty_minima,prezzo_acq,barcode,note)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [id, nome, categoria, compatibile, fornitore_id||null, qty, qty_minima, prezzo_acq, barcode||null, note]);
  } catch(e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Barcode già esistente' });
    throw e;
  }
  res.status(201).json(get('SELECT * FROM ricambi WHERE id=?', [id]));
});

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  const { nome, categoria, compatibile, fornitore_id, qty, qty_minima, prezzo_acq, barcode, note } = req.body;
  run(`UPDATE ricambi SET nome=?,categoria=?,compatibile=?,fornitore_id=?,qty=?,qty_minima=?,prezzo_acq=?,barcode=?,note=? WHERE id=?`,
      [nome, categoria, compatibile, fornitore_id||null, qty, qty_minima, prezzo_acq, barcode||null, note, req.params.id]);
  res.json(get('SELECT * FROM ricambi WHERE id=?', [req.params.id]));
});

// PATCH /ricambi/:id/qty — aggiusta quantità rapidamente
router.patch('/:id/qty', (req, res) => {
  const { run, get } = req.app.locals;
  const { delta } = req.body; // +1 o -1
  const r = get('SELECT qty FROM ricambi WHERE id=?', [req.params.id]);
  if (!r) return res.status(404).json({ error: 'Non trovato' });
  const newQty = Math.max(0, r.qty + (delta||0));
  run('UPDATE ricambi SET qty=? WHERE id=?', [newQty, req.params.id]);
  res.json({ qty: newQty });
});

router.delete('/:id', (req, res) => {
  req.app.locals.run('DELETE FROM ricambi WHERE id=?', [req.params.id]);
  res.json({ message: 'Eliminato' });
});

module.exports = router;
