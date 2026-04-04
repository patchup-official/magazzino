// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// Helper sql.js - esegue query con params e ritorna array di oggetti
function dbAll(db, query, params = []) {
  const stmt = db.prepare(query)
  const result = stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
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

// GET /api/servizi/stats - Statistiche servizi (DEVE stare prima di /:id)
router.get('/stats', (req, res) => {
  try {
    const db = req.db

    const totali = dbGet(db, 'SELECT COUNT(*) as count FROM servizi').count
    const in_corso = dbGet(db, 'SELECT COUNT(*) as count FROM servizi WHERE stato = "in_corso"').count
    const completati = dbGet(db, 'SELECT COUNT(*) as count FROM servizi WHERE stato = "completato"').count
    const fatturatoRow = dbGet(db, 'SELECT SUM(prezzo) as total FROM servizi WHERE stato = "completato"')

    res.json({
      success: true,
      data: {
        totali,
        in_corso,
        completati,
        fatturato: fatturatoRow?.total || 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/servizi - Lista servizi con filtri
router.get('/', (req, res) => {
  const { stato, cliente, tipo } = req.query

  try {
    const db = req.db
    let query = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') {
      query += ' AND stato = ?'
      params.push(stato)
    }

    if (cliente) {
      query += ' AND cliente LIKE ?'
      params.push(`%${cliente}%`)
    }

    if (tipo) {
      query += ' AND tipo_servizio = ?'
      params.push(tipo)
    }

    query += ' ORDER BY created_at DESC'

    const servizi = dbAll(db, query, params)

    const stats = {
      totali: servizi.length,
      in_corso: servizi.filter(s => s.stato === 'in_corso').length,
      completati: servizi.filter(s => s.stato === 'completato').length,
      fatturato: servizi.filter(s => s.stato === 'completato').reduce((sum, s) => sum + (s.prezzo || 0), 0)
    }

    res.json({ success: true, data: servizi, stats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/servizi - Nuovo servizio
router.post('/', (req, res) => {
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const db = req.db
    const id = Date.now().toString()

    dbRun(db, `
      INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')
    `, [
      id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
      descrizione || '', priorita || 'normale', prezzo, note || '',
      data_richiesta || new Date().toISOString().split('T')[0],
      data_consegna_prevista || ''
    ])

    req.saveDB()

    const servizio = dbGet(db, 'SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/servizi/:id - Modifica servizio
router.put('/:id', (req, res) => {
  const { id } = req.params
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato
  } = req.body

  try {
    const db = req.db

    dbRun(db, `
      UPDATE servizi SET
        cliente = ?, telefono = ?, dispositivo = ?, tipo_servizio = ?, nome_servizio = ?,
        descrizione = ?, priorita = ?, prezzo = ?, note = ?, data_consegna_prevista = ?, stato = ?
      WHERE id = ?
    `, [
      cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
      descrizione, priorita, prezzo, note, data_consegna_prevista, stato, id
    ])

    req.saveDB()

    const servizio = dbGet(db, 'SELECT * FROM servizi WHERE id = ?', [id])
    if (!servizio) {
      return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    }

    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /api/servizi/:id/complete - Completa servizio
router.put('/:id/complete', (req, res) => {
  const { id } = req.params

  try {
    const db = req.db

    dbRun(db, 'UPDATE servizi SET stato = "completato" WHERE id = ?', [id])
    req.saveDB()

    const servizio = dbGet(db, 'SELECT * FROM servizi WHERE id = ?', [id])
    if (!servizio) {
      return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    }

    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/servizi/:id - Elimina servizio
router.delete('/:id', (req, res) => {
  const { id } = req.params

  try {
    const db = req.db

    const existing = dbGet(db, 'SELECT id FROM servizi WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    }

    dbRun(db, 'DELETE FROM servizi WHERE id = ?', [id])
    req.saveDB()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
