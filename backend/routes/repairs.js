// routes/repairs.js - Gestione Riparazioni

const express = require('express');
const router = express.Router();

// GET /repairs
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { stato, priorita } = req.query;
  let query = 'SELECT * FROM repairs';
  const params = [], conds = [];
  if (stato)    { conds.push('stato = ?');    params.push(stato); }
  if (priorita) { conds.push('priorita = ?'); params.push(priorita); }
  if (conds.length) query += ' WHERE ' + conds.join(' AND ');
  query += ' ORDER BY created_at DESC';
  const repairs = db.prepare(query).all(...params);
  res.json({ data: repairs, total: repairs.length });
});

// POST /repairs
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const uid = req.app.locals.uid;
  const { cliente, tel, brand, modello, problema, priorita = 'normale', costo = 0, data_stimata, note } = req.body;
  if (!cliente || !modello) return res.status(400).json({ error: 'cliente e modello obbligatori' });
  const id = uid();
  db.prepare(`
    INSERT INTO repairs (id, cliente, tel, brand, modello, problema, priorita, costo, data_stimata, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, cliente, tel, brand, modello, problema, priorita, costo, data_stimata, note);
  // Aggiorna/crea dispositivo come in_riparazione
  db.prepare(`
    INSERT INTO devices (id, brand, modello, condizione, stato, provenienza, prezzo_acq)
    VALUES (?, ?, ?, 'C', 'in_riparazione', 'privato', 0)
  `).run(uid(), brand, modello);
  res.status(201).json(db.prepare('SELECT * FROM repairs WHERE id = ?').get(id));
});

// PUT /repairs/:id/progress
router.put('/:id/progress', (req, res) => {
  const db = req.app.locals.db;
  const { progress } = req.body;
  db.prepare('UPDATE repairs SET progress = ? WHERE id = ?').run(progress, req.params.id);
  res.json({ ok: true });
});

// PUT /repairs/:id/complete
router.put('/:id/complete', (req, res) => {
  const db = req.app.locals.db;
  db.prepare("UPDATE repairs SET stato = 'completata', progress = 100 WHERE id = ?").run(req.params.id);
  res.json(db.prepare('SELECT * FROM repairs WHERE id = ?').get(req.params.id));
});

// DELETE /repairs/:id
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const result = db.prepare('DELETE FROM repairs WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Riparazione non trovata' });
  res.json({ message: 'Eliminata' });
});

module.exports = router;
