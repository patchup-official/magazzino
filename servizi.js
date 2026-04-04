// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /api/servizi - Lista servizi con filtri
router.get('/', async (req, res) => {
  const { stato, cliente, tipo } = req.query
  
  try {
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

    const stmt = req.db.prepare(query)
    const servizi = stmt.all(...params)

    // Statistiche per la dashboard
    const stats = {
      totali: servizi.length,
      in_corso: servizi.filter(s => s.stato === 'in_corso').length,
      completati: servizi.filter(s => s.stato === 'completato').length,
      fatturato: servizi.filter(s => s.stato === 'completato').reduce((sum, s) => sum + s.prezzo, 0)
    }

    res.json({ 
      success: true, 
      data: servizi,
      stats 
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// POST /api/servizi - Nuovo servizio
router.post('/', async (req, res) => {
  const { 
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista 
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ 
      success: false, 
      error: 'Campi obbligatori mancanti' 
    })
  }

  try {
    const id = Date.now().toString()
    
    const stmt = req.db.prepare(`
      INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')
    `)
    
    stmt.run(
      id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
      descrizione, priorita || 'normale', prezzo, note, 
      data_richiesta || new Date().toISOString().split('T')[0], 
      data_consegna_prevista
    )

    // Ritorna il servizio creato
    const getStmt = req.db.prepare('SELECT * FROM servizi WHERE id = ?')
    const servizio = getStmt.get(id)

    res.json({ 
      success: true, 
      data: servizio 
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// PUT /api/servizi/:id - Modifica servizio
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { 
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato 
  } = req.body

  try {
    const stmt = req.db.prepare(`
      UPDATE servizi SET 
        cliente = ?, telefono = ?, dispositivo = ?, tipo_servizio = ?, nome_servizio = ?,
        descrizione = ?, priorita = ?, prezzo = ?, note = ?, data_consegna_prevista = ?, stato = ?
      WHERE id = ?
    `)
    
    const result = stmt.run(
      cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
      descrizione, priorita, prezzo, note, data_consegna_prevista, stato, id
    )

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Servizio non trovato' 
      })
    }

    // Ritorna il servizio aggiornato
    const getStmt = req.db.prepare('SELECT * FROM servizi WHERE id = ?')
    const servizio = getStmt.get(id)

    res.json({ 
      success: true, 
      data: servizio 
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// PUT /api/servizi/:id/complete - Completa servizio
router.put('/:id/complete', async (req, res) => {
  const { id } = req.params

  try {
    const stmt = req.db.prepare('UPDATE servizi SET stato = "completato" WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Servizio non trovato' 
      })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// DELETE /api/servizi/:id - Elimina servizio
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const stmt = req.db.prepare('DELETE FROM servizi WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Servizio non trovato' 
      })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// GET /api/servizi/stats - Statistiche servizi
router.get('/stats', async (req, res) => {
  try {
    const totalStmt = req.db.prepare('SELECT COUNT(*) as count FROM servizi')
    const inCorsoStmt = req.db.prepare('SELECT COUNT(*) as count FROM servizi WHERE stato = "in_corso"')
    const completatiStmt = req.db.prepare('SELECT COUNT(*) as count FROM servizi WHERE stato = "completato"')
    const fatturatoStmt = req.db.prepare('SELECT SUM(prezzo) as total FROM servizi WHERE stato = "completato"')

    const stats = {
      totali: totalStmt.get().count,
      in_corso: inCorsoStmt.get().count,
      completati: completatiStmt.get().count,
      fatturato: fatturatoStmt.get().total || 0
    }

    res.json({ 
      success: true, 
      data: stats 
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

module.exports = router
