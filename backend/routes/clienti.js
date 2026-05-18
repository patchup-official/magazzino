// backend/routes/clienti.js
const express = require('express')
const router = express.Router()

// GET /clienti
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { q, search, tipo } = req.query
  const term = q || search
  try {
    let sql = 'SELECT * FROM clienti WHERE 1=1'
    const params = []
    if (term) {
      sql += ' AND (nome LIKE ? OR cognome LIKE ? OR ragione_soc LIKE ? OR telefono LIKE ? OR email LIKE ? OR citta LIKE ?)'
      const like = `%${term}%`
      params.push(like, like, like, like, like, like)
    }
    if (tipo && tipo !== 'all') {
      sql += ' AND tipo = ?'
      params.push(tipo)
    }
    sql += ' ORDER BY nome ASC'
    res.json(query(sql, params))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const c = req.app.locals.get('SELECT * FROM clienti WHERE id = ?', [req.params.id])
    if (!c) return res.status(404).json({ error: 'Non trovato' })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const { tipo, nome, cognome, ragione_soc, codice_fisc, piva, telefono, email, indirizzo, cap, citta, note } = req.body
  if (!nome) return res.status(400).json({ error: 'Nome obbligatorio' })
  try {
    const id = uid()
    run('INSERT INTO clienti (id,tipo,nome,cognome,ragione_soc,codice_fisc,piva,telefono,email,indirizzo,cap,citta,note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, tipo||'persona_fisica', nome, cognome||'', ragione_soc||'', codice_fisc||'', piva||'', telefono||'', email||'', indirizzo||'', cap||'', citta||'', note||''])
    res.json(get('SELECT * FROM clienti WHERE id = ?', [id]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const { tipo, nome, cognome, ragione_soc, codice_fisc, piva, telefono, email, indirizzo, cap, citta, note } = req.body
  try {
    run('UPDATE clienti SET tipo=?,nome=?,cognome=?,ragione_soc=?,codice_fisc=?,piva=?,telefono=?,email=?,indirizzo=?,cap=?,citta=?,note=? WHERE id=?',
      [tipo||'persona_fisica', nome, cognome||'', ragione_soc||'', codice_fisc||'', piva||'', telefono||'', email||'', indirizzo||'', cap||'', citta||'', note||'', req.params.id])
    const c = get('SELECT * FROM clienti WHERE id = ?', [req.params.id])
    if (!c) return res.status(404).json({ error: 'Non trovato' })
    res.json(c)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    if (!get('SELECT id FROM clienti WHERE id = ?', [req.params.id])) return res.status(404).json({ error: 'Non trovato' })
    run('DELETE FROM clienti WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
