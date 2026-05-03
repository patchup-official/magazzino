// routes/repairs.js

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { query } = req.app.locals;
  const { stato, priorita } = req.query;
  let sql = 'SELECT * FROM repairs';
  const params = [], conds = [];
  if (stato)    { conds.push('stato = ?');    params.push(stato); }
  if (priorita) { conds.push('priorita = ?'); params.push(priorita); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const repairs = query(sql, params);
  res.json({ data: repairs, total: repairs.length });
});

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals;
  const { cliente, tel, brand, modello, problema, priorita='normale', costo=0, data_stimata, note, ora_inizio, durata_minuti } = req.body;
  if (!cliente||!modello) return res.status(400).json({ error: 'cliente e modello obbligatori' });
  const id = uid();
  run(`INSERT INTO repairs (id,cliente,tel,brand,modello,problema,priorita,costo,data_stimata,note,ora_inizio,durata_minuti)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id,cliente,tel,brand,modello,problema,priorita,costo,data_stimata,note,ora_inizio||null,durata_minuti||null]);
  run(`INSERT INTO devices (id,brand,modello,condizione,stato,provenienza,prezzo_acq)
       VALUES (?,?,?,'C','in_riparazione','privato',0)`, [uid(), brand||'', modello]);
  res.status(201).json(get('SELECT * FROM repairs WHERE id = ?', [id]));
});

router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals;
  const { ora_inizio, durata_minuti, data_stimata } = req.body;
  if (!get('SELECT id FROM repairs WHERE id=?', [req.params.id]))
    return res.status(404).json({ error: 'Non trovata' });
  run('UPDATE repairs SET ora_inizio=?, durata_minuti=?, data_stimata=COALESCE(?,data_stimata) WHERE id=?',
      [ora_inizio, durata_minuti, data_stimata||null, req.params.id]);
  res.json(get('SELECT * FROM repairs WHERE id=?', [req.params.id]));
});

router.put('/:id/progress', (req, res) => {
  const { run } = req.app.locals;
  run('UPDATE repairs SET progress = ? WHERE id = ?', [req.body.progress, req.params.id]);
  res.json({ ok: true });
});

router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals;
  run("UPDATE repairs SET stato='completata', progress=100 WHERE id=?", [req.params.id]);
  res.json(get('SELECT * FROM repairs WHERE id=?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  if (!get('SELECT id FROM repairs WHERE id=?', [req.params.id]))
    return res.status(404).json({ error: 'Non trovata' });
  run('DELETE FROM repairs WHERE id=?', [req.params.id]);
  res.json({ message: 'Eliminata' });
});

module.exports = router;// routes/repairs.js
