// backend/routes/promemoria.js
const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  const { query } = req.app.locals
  try {
    const data = query('SELECT * FROM promemoria ORDER BY data ASC, ora ASC')
    res.json({ success: true, data })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const { titolo, nota, data, ora, ricorrenza } = req.body
  if(!titolo || !data) return res.status(400).json({ success: false, error: 'titolo e data obbligatori' })
  const id = uid()
  run('INSERT INTO promemoria (id,titolo,nota,data,ora,ricorrenza) VALUES (?,?,?,?,?,?)',
      [id, titolo, nota||'', data, ora||null, ricorrenza||null])
  res.json({ success: true, data: get('SELECT * FROM promemoria WHERE id=?', [id]) })
})

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const { titolo, nota, data, ora, ricorrenza } = req.body
  if(!get('SELECT id FROM promemoria WHERE id=?', [req.params.id]))
    return res.status(404).json({ success: false, error: 'Non trovato' })
  run('UPDATE promemoria SET titolo=?,nota=?,data=?,ora=?,ricorrenza=? WHERE id=?',
      [titolo, nota||'', data, ora||null, ricorrenza||null, req.params.id])
  res.json({ success: true, data: get('SELECT * FROM promemoria WHERE id=?', [req.params.id]) })
})

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  if(!get('SELECT id FROM promemoria WHERE id=?', [req.params.id]))
    return res.status(404).json({ success: false, error: 'Non trovato' })
  run('DELETE FROM promemoria WHERE id=?', [req.params.id])
  res.json({ success: true })
})

module.exports = router
