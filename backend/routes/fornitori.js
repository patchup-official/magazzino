// routes/fornitori.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const fornitori = req.app.locals.query('SELECT * FROM fornitori ORDER BY nome ASC');
  res.json({ data: fornitori, total: fornitori.length });
});

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals;
  const { nome, contatto, email, telefono, piva, indirizzo, note } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obbligatorio' });
  const id = uid();
  run(`INSERT INTO fornitori (id,nome,contatto,email,telefono,piva,indirizzo,note)
       VALUES (?,?,?,?,?,?,?,?)`, [id, nome, contatto, email, telefono, piva, indirizzo, note]);
  res.status(201).json(get('SELECT * FROM fornitori WHERE id=?', [id]));
});

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  const { nome, contatto, email, telefono, piva, indirizzo, note } = req.body;
  if (!get('SELECT id FROM fornitori WHERE id=?', [req.params.id]))
    return res.status(404).json({ error: 'Non trovato' });
  run(`UPDATE fornitori SET nome=?,contatto=?,email=?,telefono=?,piva=?,indirizzo=?,note=? WHERE id=?`,
      [nome, contatto, email, telefono, piva, indirizzo, note, req.params.id]);
  res.json(get('SELECT * FROM fornitori WHERE id=?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  if (!get('SELECT id FROM fornitori WHERE id=?', [req.params.id]))
    return res.status(404).json({ error: 'Non trovato' });
  run('DELETE FROM fornitori WHERE id=?', [req.params.id]);
  res.json({ message: 'Eliminato' });
});

module.exports = router;
