// backend/routes/clienti.js

const express = require('express')
const router = express.Router()

// GET /clienti - Lista clienti con ricerca
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { q, tipo } = req.query
  try {
    let sql = 'SELECT * FROM clienti WHERE 1=1'
    const params = []

    if (q) {
      sql += ' AND (nome LIKE ? OR cognome LIKE ? OR ragione_soc LIKE ? OR telefono LIKE ? OR email LIKE ?)'
      const like = `%${q}%`
      params.push(like, like, like, like, like)
    }

    if (tipo && tipo !== 'all') {
      sql += ' AND tipo = ?'
      params.push(tipo)
    }

    sql += ' ORDER BY created_at DESC'

    const clienti = query(sql, params)
    res.json({ success: true, data: clienti })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /clienti/:id - Singolo cliente
router.get('/:id', (req, res) => {
  try {
    const cliente = req.app.locals.get('SELECT * FROM clienti WHERE id = ?', [req.params.id])
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente non trovato' })
    res.json({ success: true, data: cliente })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /clienti - Nuovo cliente
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    tipo, nome, cognome, ragione_soc, codice_fisc, piva,
    telefono, email, indirizzo, cap, citta, note
  } = req.body

  if (!nome) {
    return res.status(400).json({ success: false, error: 'Nome obbligatorio' })
  }

  try {
    const id = uid()
    run(`
      INSERT INTO clienti (
        id, tipo, nome, cognome, ragione_soc, codice_fisc, piva,
        telefono, email, indirizzo, cap, citta, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tipo || 'persona_fisica', nome,
      cognome || '', ragione_soc || '', codice_fisc || '',
      piva || '', telefono || '', email || '',
      indirizzo || '', cap || '', citta || '', note || ''
    ])

    const cliente = get('SELECT * FROM clienti WHERE id = ?', [id])
    res.json({ success: true, data: cliente })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /clienti/:id - Modifica cliente
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    tipo, nome, cognome, ragione_soc, codice_fisc, piva,
    telefono, email, indirizzo, cap, citta, note
  } = req.body

  try {
    run(`
      UPDATE clienti SET
        tipo = ?, nome = ?, cognome = ?, ragione_soc = ?, codice_fisc = ?, piva = ?,
        telefono = ?, email = ?, indirizzo = ?, cap = ?, citta = ?, note = ?
      WHERE id = ?
    `, [
      tipo || 'persona_fisica', nome,
      cognome || '', ragione_soc || '', codice_fisc || '', piva || '',
      telefono || '', email || '', indirizzo || '', cap || '', citta || '', note || '',
      req.params.id
    ])

    const cliente = get('SELECT * FROM clienti WHERE id = ?', [req.params.id])
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente non trovato' })
    res.json({ success: true, data: cliente })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /clienti/:id - Elimina cliente
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM clienti WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Cliente non trovato' })
    run('DELETE FROM clienti WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
