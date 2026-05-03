// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({ success: true, data: {
      totali: get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
      in_corso: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
      completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      fatturato: get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []
    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push('%'+cliente+'%') }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }
    sql += ' ORDER BY created_at DESC'
    const servizi = query(sql, params)
    res.json({ success: true, data: servizi, stats: {
      totali: servizi.length,
      in_corso: servizi.filter(s=>s.stato==='in_corso').length,
      completati: servizi.filter(s=>s.stato==='completato').length,
      fatturato: servizi.filter(s=>s.stato==='completato').reduce((sum,s)=>sum+(s.prezzo||0),0)
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti } = req.body
  if (!cliente||!dispositivo||!tipo_servizio||!nome_servizio||!prezzo)
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  try {
    const id = uid()
    run('INSERT INTO servizi (id,cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_richiesta,data_consegna_prevista,ora_inizio,durata_minuti,stato) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'in_corso\')',
      [id,cliente,telefono||'',dispositivo,tipo_servizio,nome_servizio,descrizione||'',priorita||'normale',prezzo,note||'',
       data_richiesta||new Date().toISOString().split('T')[0], data_consegna_prevista||'',
       ora_inizio||null, durata_minuti||null])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?,durata_minuti=?,data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio,durata_minuti,data_consegna_prevista||null,req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[req.params.id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato="completato" WHERE id=?',[req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti } = req.body
  try {
    run('UPDATE servizi SET cliente=?,telefono=?,dispositivo=?,tipo_servizio=?,nome_servizio=?,descrizione=?,priorita=?,prezzo=?,note=?,data_consegna_prevista=?,stato=?,ora_inizio=?,durata_minuti=? WHERE id=?',
      [cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_consegna_prevista,stato,
       ora_inizio||null,durata_minuti||null,req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('DELETE FROM servizi WHERE id=?',[req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

module.exports = router// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
        ora_inizio, durata_minuti, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || '',
       ora_inizio || null, durata_minuti || null])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})


// PUT /servizi/:id/slot - aggiorna slot orario dal calendario
router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id = ?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?, durata_minuti=?, data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio, durata_minuti, data_consegna_prevista || null, req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?', [req.params.id]) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id/slot
router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id = ?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?, durata_minuti=?, data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio, durata_minuti, data_consegna_prevista || null, req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?', [req.params.id]) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id/slot
router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id = ?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?, durata_minuti=?, data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio, durata_minuti, data_consegna_prevista || null, req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?', [req.params.id]) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?,
        ora_inizio=?, durata_minuti=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
       ora_inizio || null, durata_minuti || null, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
        ora_inizio, durata_minuti, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || '',
       ora_inizio || null, durata_minuti || null])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?,
        ora_inizio=?, durata_minuti=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
       ora_inizio || null, durata_minuti || null, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({ success: true, data: {
      totali: get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
      in_corso: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
      completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      fatturato: get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []
    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push('%'+cliente+'%') }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }
    sql += ' ORDER BY created_at DESC'
    const servizi = query(sql, params)
    res.json({ success: true, data: servizi, stats: {
      totali: servizi.length,
      in_corso: servizi.filter(s=>s.stato==='in_corso').length,
      completati: servizi.filter(s=>s.stato==='completato').length,
      fatturato: servizi.filter(s=>s.stato==='completato').reduce((sum,s)=>sum+(s.prezzo||0),0)
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti } = req.body
  if (!cliente||!dispositivo||!tipo_servizio||!nome_servizio||!prezzo)
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  try {
    const id = uid()
    run('INSERT INTO servizi (id,cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_richiesta,data_consegna_prevista,ora_inizio,durata_minuti,stato) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'in_corso\')',
      [id,cliente,telefono||'',dispositivo,tipo_servizio,nome_servizio,descrizione||'',priorita||'normale',prezzo,note||'',
       data_richiesta||new Date().toISOString().split('T')[0], data_consegna_prevista||'',
       ora_inizio||null, durata_minuti||null])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?,durata_minuti=?,data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio,durata_minuti,data_consegna_prevista||null,req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[req.params.id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato="completato" WHERE id=?',[req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti } = req.body
  try {
    run('UPDATE servizi SET cliente=?,telefono=?,dispositivo=?,tipo_servizio=?,nome_servizio=?,descrizione=?,priorita=?,prezzo=?,note=?,data_consegna_prevista=?,stato=?,ora_inizio=?,durata_minuti=? WHERE id=?',
      [cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_consegna_prevista,stato,
       ora_inizio||null,durata_minuti||null,req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('DELETE FROM servizi WHERE id=?',[req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

module.exports = router// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
        ora_inizio, durata_minuti, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || '',
       ora_inizio || null, durata_minuti || null])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})


// PUT /servizi/:id/slot - aggiorna slot orario dal calendario
router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id = ?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?, durata_minuti=?, data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio, durata_minuti, data_consegna_prevista || null, req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?', [req.params.id]) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?,
        ora_inizio=?, durata_minuti=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
       ora_inizio || null, durata_minuti || null, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
        ora_inizio, durata_minuti, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || '',
       ora_inizio || null, durata_minuti || null])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?,
        ora_inizio=?, durata_minuti=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
       ora_inizio || null, durata_minuti || null, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({ success: true, data: {
      totali: get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
      in_corso: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
      completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      fatturato: get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []
    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push('%'+cliente+'%') }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }
    sql += ' ORDER BY created_at DESC'
    const servizi = query(sql, params)
    res.json({ success: true, data: servizi, stats: {
      totali: servizi.length,
      in_corso: servizi.filter(s=>s.stato==='in_corso').length,
      completati: servizi.filter(s=>s.stato==='completato').length,
      fatturato: servizi.filter(s=>s.stato==='completato').reduce((sum,s)=>sum+(s.prezzo||0),0)
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti } = req.body
  if (!cliente||!dispositivo||!tipo_servizio||!nome_servizio||!prezzo)
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  try {
    const id = uid()
    run('INSERT INTO servizi (id,cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_richiesta,data_consegna_prevista,ora_inizio,durata_minuti,stato) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'in_corso\')',
      [id,cliente,telefono||'',dispositivo,tipo_servizio,nome_servizio,descrizione||'',priorita||'normale',prezzo,note||'',
       data_richiesta||new Date().toISOString().split('T')[0], data_consegna_prevista||'',
       ora_inizio||null, durata_minuti||null])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?,durata_minuti=?,data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio,durata_minuti,data_consegna_prevista||null,req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[req.params.id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato="completato" WHERE id=?',[req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti } = req.body
  try {
    run('UPDATE servizi SET cliente=?,telefono=?,dispositivo=?,tipo_servizio=?,nome_servizio=?,descrizione=?,priorita=?,prezzo=?,note=?,data_consegna_prevista=?,stato=?,ora_inizio=?,durata_minuti=? WHERE id=?',
      [cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_consegna_prevista,stato,
       ora_inizio||null,durata_minuti||null,req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('DELETE FROM servizi WHERE id=?',[req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

module.exports = router// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
        ora_inizio, durata_minuti, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || '',
       ora_inizio || null, durata_minuti || null])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})


// PUT /servizi/:id/slot - aggiorna slot orario dal calendario
router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id = ?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?, durata_minuti=?, data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio, durata_minuti, data_consegna_prevista || null, req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?', [req.params.id]) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id/slot
router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id = ?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?, durata_minuti=?, data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio, durata_minuti, data_consegna_prevista || null, req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?', [req.params.id]) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?,
        ora_inizio=?, durata_minuti=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
       ora_inizio || null, durata_minuti || null, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
        ora_inizio, durata_minuti, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || '',
       ora_inizio || null, durata_minuti || null])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?,
        ora_inizio=?, durata_minuti=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
       ora_inizio || null, durata_minuti || null, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({ success: true, data: {
      totali: get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
      in_corso: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
      completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      fatturato: get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []
    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push('%'+cliente+'%') }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }
    sql += ' ORDER BY created_at DESC'
    const servizi = query(sql, params)
    res.json({ success: true, data: servizi, stats: {
      totali: servizi.length,
      in_corso: servizi.filter(s=>s.stato==='in_corso').length,
      completati: servizi.filter(s=>s.stato==='completato').length,
      fatturato: servizi.filter(s=>s.stato==='completato').reduce((sum,s)=>sum+(s.prezzo||0),0)
    }})
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti } = req.body
  if (!cliente||!dispositivo||!tipo_servizio||!nome_servizio||!prezzo)
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  try {
    const id = uid()
    run('INSERT INTO servizi (id,cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_richiesta,data_consegna_prevista,ora_inizio,durata_minuti,stato) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'in_corso\')',
      [id,cliente,telefono||'',dispositivo,tipo_servizio,nome_servizio,descrizione||'',priorita||'normale',prezzo,note||'',
       data_richiesta||new Date().toISOString().split('T')[0], data_consegna_prevista||'',
       ora_inizio||null, durata_minuti||null])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?,durata_minuti=?,data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio,durata_minuti,data_consegna_prevista||null,req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?',[req.params.id]) })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato="completato" WHERE id=?',[req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const { cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti } = req.body
  try {
    run('UPDATE servizi SET cliente=?,telefono=?,dispositivo=?,tipo_servizio=?,nome_servizio=?,descrizione=?,priorita=?,prezzo=?,note=?,data_consegna_prevista=?,stato=?,ora_inizio=?,durata_minuti=? WHERE id=?',
      [cliente,telefono,dispositivo,tipo_servizio,nome_servizio,descrizione,priorita,prezzo,note,data_consegna_prevista,stato,
       ora_inizio||null,durata_minuti||null,req.params.id])
    const s = get('SELECT * FROM servizi WHERE id=?',[req.params.id])
    if (!s) return res.status(404).json({ success: false, error: 'Non trovato' })
    res.json({ success: true, data: s })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    if (!get('SELECT id FROM servizi WHERE id=?',[req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('DELETE FROM servizi WHERE id=?',[req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

module.exports = router// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
    ora_inizio, durata_minuti
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista,
        ora_inizio, durata_minuti, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || '',
       ora_inizio || null, durata_minuti || null])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})


// PUT /servizi/:id/slot - aggiorna slot orario dal calendario
router.put('/:id/slot', (req, res) => {
  const { run, get } = req.app.locals
  const { ora_inizio, durata_minuti, data_consegna_prevista } = req.body
  try {
    if (!get('SELECT id FROM servizi WHERE id = ?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Non trovato' })
    run('UPDATE servizi SET ora_inizio=?, durata_minuti=?, data_consegna_prevista=COALESCE(?,data_consegna_prevista) WHERE id=?',
        [ora_inizio, durata_minuti, data_consegna_prevista || null, req.params.id])
    res.json({ success: true, data: get('SELECT * FROM servizi WHERE id=?', [req.params.id]) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
    ora_inizio, durata_minuti
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?,
        ora_inizio=?, durata_minuti=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato,
       ora_inizio || null, durata_minuti || null, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
// backend/routes/servizi.js

const express = require('express')
const router = express.Router()

// GET /servizi/stats
router.get('/stats', (req, res) => {
  const { get } = req.app.locals
  try {
    res.json({
      success: true,
      data: {
        totali:     get('SELECT COUNT(*) as n FROM servizi')?.n || 0,
        in_corso:   get('SELECT COUNT(*) as n FROM servizi WHERE stato = "in_corso"')?.n || 0,
        completati: get('SELECT COUNT(*) as n FROM servizi WHERE stato = "completato"')?.n || 0,
        fatturato:  get('SELECT SUM(prezzo) as n FROM servizi WHERE stato = "completato"')?.n || 0,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /servizi
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { stato, cliente, tipo } = req.query
  try {
    let sql = 'SELECT * FROM servizi WHERE 1=1'
    const params = []

    if (stato && stato !== 'all') { sql += ' AND stato = ?'; params.push(stato) }
    if (cliente) { sql += ' AND cliente LIKE ?'; params.push(`%${cliente}%`) }
    if (tipo) { sql += ' AND tipo_servizio = ?'; params.push(tipo) }

    sql += ' ORDER BY created_at DESC'

    const servizi = query(sql, params)
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

// POST /servizi
router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista
  } = req.body

  if (!cliente || !dispositivo || !tipo_servizio || !nome_servizio || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = uid()
    run(`INSERT INTO servizi (
        id, cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
        descrizione, priorita, prezzo, note, data_richiesta, data_consegna_prevista, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_corso')`,
      [id, cliente, telefono || '', dispositivo, tipo_servizio, nome_servizio,
       descrizione || '', priorita || 'normale', prezzo, note || '',
       data_richiesta || new Date().toISOString().split('T')[0],
       data_consegna_prevista || ''])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [id])
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id/complete
router.put('/:id/complete', (req, res) => {
  const { run, get } = req.app.locals
  try {
    run('UPDATE servizi SET stato = "completato" WHERE id = ?', [req.params.id])
    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// PUT /servizi/:id
router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const {
    cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
    descrizione, priorita, prezzo, note, data_consegna_prevista, stato
  } = req.body

  try {
    run(`UPDATE servizi SET
        cliente=?, telefono=?, dispositivo=?, tipo_servizio=?, nome_servizio=?,
        descrizione=?, priorita=?, prezzo=?, note=?, data_consegna_prevista=?, stato=?
      WHERE id=?`,
      [cliente, telefono, dispositivo, tipo_servizio, nome_servizio,
       descrizione, priorita, prezzo, note, data_consegna_prevista, stato, req.params.id])

    const servizio = get('SELECT * FROM servizi WHERE id = ?', [req.params.id])
    if (!servizio) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    res.json({ success: true, data: servizio })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /servizi/:id
router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  try {
    const existing = get('SELECT id FROM servizi WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, error: 'Servizio non trovato' })
    run('DELETE FROM servizi WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
