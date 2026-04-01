// routes/interventi.js
const express = require('express');
const router = express.Router();

// GET /interventi?device_id=xxx
router.get('/', (req, res) => {
  const { query } = req.app.locals;
  const { device_id } = req.query;
  let sql = `SELECT i.*, f.nome as fornitore_nome
             FROM interventi i
             LEFT JOIN fornitori f ON i.fornitore_id = f.id`;
  const params = [];
  if (device_id) { sql += ' WHERE i.device_id = ?'; params.push(device_id); }
  sql += ' ORDER BY i.created_at DESC';
  res.json({ data: query(sql, params) });
});

// POST /interventi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals;
  const { device_id, tipo, descrizione, costo=0, fornitore_id, eseguito_da, data, note } = req.body;
  if (!device_id || !tipo) return res.status(400).json({ error: 'device_id e tipo obbligatori' });
  const id = uid();
  run(`INSERT INTO interventi (id,device_id,tipo,descrizione,costo,fornitore_id,eseguito_da,data,note)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, device_id, tipo, descrizione, costo, fornitore_id||null, eseguito_da, data||new Date().toISOString(), note]);
  res.status(201).json(get('SELECT * FROM interventi WHERE id=?', [id]));
});

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  const { tipo, descrizione, costo, fornitore_id, eseguito_da, data, note } = req.body;
  run(`UPDATE interventi SET tipo=?,descrizione=?,costo=?,fornitore_id=?,eseguito_da=?,data=?,note=? WHERE id=?`,
      [tipo, descrizione, costo, fornitore_id||null, eseguito_da, data, note, req.params.id]);
  res.json(get('SELECT * FROM interventi WHERE id=?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  req.app.locals.run('DELETE FROM interventi WHERE id=?', [req.params.id]);
  res.json({ message: 'Eliminato' });
});

module.exports = router;
