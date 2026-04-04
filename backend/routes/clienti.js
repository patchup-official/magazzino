// backend/routes/clienti.js

const express = require('express')
const router = express.Router()

function dbAll(db, query, params = []) {
  const stmt = db.prepare(query)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function dbGet(db, query, params = []) {
  const rows = dbAll(db, query, params)
  return rows[0] || null
}

function dbRun(db, query, params = []) {
  const stmt = db.prepare(query)
  stmt.bind(params)
  stmt.step()
  stmt.free()
}

// GET /api/clienti - Lista clienti con ricerca
router.get('/', (req, res) => {
  const { q, tipo } = req.query
  try {
    let query = 'SELECT * FROM clienti WHERE 1=1'
    const params = []

    if (q) {
      query += ' AND (nome LIKE ? OR cognome LIKE ? OR ragione_soc LIKE ? OR telefono LIKE ? OR email LIKE ?)'
      const like = `%${q}%`
      params.push(like, like, like, like, like)
    }

    if (tipo && tipo !== 'all') {
      query += ' AND tipo = ?'
      params.push(tipo)
    }

    query += ' ORDER BY created_at DESC'

    const clienti = dbAll(req.db, query, params)
    res.json({ success: true, data: clienti })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/clienti/:id - Singolo cliente
router.get('/:id', (req, res) => {
  try {
    const cliente = dbGet(req.db, 'SELECT * FROM clienti WHERE id = ?', [req.params.id])
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente non trovato' })
    res.json({ success: true, data: cliente })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/clienti - Nuovo cliente
router.post('/', (req, res) => {
  const {
    tipo, nome, cognome, ragione_soc, codice_fisc, piva,
    telefono, email, indirizzo, cap, citta, note
  } = req.body

  if (!tipo || !nome) {
    return res.status(400).json({ success: false, error: 'Tipo e nome sono obbligatori' })
  }

  try {
    const id = Date.now().toString()

    dbRun(req.db, `
      INSERT INTO clienti (
        id, tipo, nome, cognome, ragione_soc, codice_fisc, piva,
        telefono, email, indirizzo, cap, citta, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tipo, nome, cognome || '', ragione_soc || '', codice_fisc || '',
      piva || '', telefono || '', email || '', indirizzo || '', cap || '', citta || '', note || ''
    ])

    req.saveDB()

    const cliente = dbGet(req.db, 'SELECT * FROM clienti WHERE id = ?', [id])
    res.json({ success: true, data: cliente })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/clienti/:id - Modifica cliente
router.put('/:id', (req, res) => {
  const {
    tipo, nome, cognome, ragione_soc, codice_fisc, piva,
    telefono, email, indirizzo, cap, citta, note
  } = req.body

  try {
    dbRun(req.db, `
      UPDATE clienti SET
        tipo = ?, nome = ?, cognome = ?, ragione_soc = ?, codice_fisc = ?, piva = ?,
        telefono = ?, email = ?, indirizzo = ?, cap = ?, citta = ?, note = ?
      WHERE id = ?
    `, [
      tipo, nome, cognome || '', ragione_soc || '', codice_fisc || '', piva || '',
      telefono || '', email || '', indirizzo || '', cap || '', citta || '', note || '',
      req.params.id
    ])

    req.saveDB()

    const cliente = dbGet(req.db, 'SELECT * FROM clienti WHERE id = ?', [req.params.id])
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente non trovato' })
    res.json({ success: true, data: cliente })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/clienti/:id - Elimina cliente
router.delete('/:id', (req, res) => {
  try {
    const existing = dbGet(req.db, 'SELECT id FROM clienti WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Cliente non trovato' })

    dbRun(req.db, 'DELETE FROM clienti WHERE id = ?', [req.params.id])
    req.saveDB()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
