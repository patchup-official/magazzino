// routes/protezioni.js

const express = require('express')
const router = express.Router()

function genCert() {
  const now = new Date()
  const d = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `ENP-2-${d}-${rand}`
}

function statoCalcolato(dataScadenza) {
  const oggi = new Date()
  const scad = new Date(dataScadenza)
  const diff = (scad - oggi) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'scaduta'
  if (diff <= 30) return 'in_scadenza'
  return 'attiva'
}

// GET /protezioni
router.get('/', (req, res) => {
  const { stato, cliente } = req.query
  try {
    let sql = 'SELECT * FROM protezioni WHERE 1=1'
    const params = []
    if (cliente) { sql += ' AND cliente_nome LIKE ?'; params.push(`%${cliente}%`) }
    sql += ' ORDER BY created_at DESC'

    const protezioni = req.app.locals.query(sql, params)
    const result = protezioni.map(p => ({
      ...p,
      coperture: JSON.parse(p.coperture || '[]'),
      stato: statoCalcolato(p.data_scadenza)
    }))

    const filtered = stato ? result.filter(p => p.stato === stato) : result

    const stats = {
      attive:      result.filter(p => p.stato === 'attiva').length,
      in_scadenza: result.filter(p => p.stato === 'in_scadenza').length,
      scadute:     result.filter(p => p.stato === 'scaduta').length,
      totali:      result.length,
    }

    res.json({ success: true, data: filtered, stats })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// GET /protezioni/:id
router.get('/:id', (req, res) => {
  try {
    const p = req.app.locals.get('SELECT * FROM protezioni WHERE id = ?', [req.params.id])
    if (!p) return res.status(404).json({ success: false, error: 'Non trovata' })
    res.json({ success: true, data: { ...p, coperture: JSON.parse(p.coperture || '[]'), stato: statoCalcolato(p.data_scadenza) } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// POST /protezioni — crea protezione
router.post('/', (req, res) => {
  const {
    cliente_id, cliente_nome, cliente_email, cliente_tel,
    tipo_dispositivo, brand, modello, colore_storage, seriale, imei,
    piano_id, piano_nome, durata_mesi, coperture, prezzo,
    data_inizio, note, riparazione_id
  } = req.body

  if (!cliente_nome || !tipo_dispositivo || !brand || !modello || !piano_id || !prezzo) {
    return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  }

  try {
    const id = req.app.locals.uid()
    const cert = genCert()
    const inizio = data_inizio || new Date().toISOString().slice(0, 10)
    const scad = new Date(inizio)
    scad.setMonth(scad.getMonth() + parseInt(durata_mesi || 12))
    const data_scadenza = scad.toISOString().slice(0, 10)

    req.app.locals.run(`
      INSERT INTO protezioni (
        id, certificato, cliente_id, cliente_nome, cliente_email, cliente_tel,
        tipo_dispositivo, brand, modello, colore_storage, seriale, imei,
        piano_id, piano_nome, durata_mesi, coperture, prezzo,
        data_inizio, data_scadenza, note, riparazione_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      id, cert, cliente_id || null, cliente_nome, cliente_email || '', cliente_tel || '',
      tipo_dispositivo, brand, modello, colore_storage || '', seriale || '', imei || '',
      piano_id, piano_nome, durata_mesi || 12, JSON.stringify(coperture || []), prezzo,
      inizio, data_scadenza, note || '', riparazione_id || null
    ])

    const protezione = req.app.locals.get('SELECT * FROM protezioni WHERE id = ?', [id])
    res.json({
      success: true,
      data: { ...protezione, coperture: JSON.parse(protezione.coperture || '[]'), stato: statoCalcolato(protezione.data_scadenza) }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// PUT /protezioni/:id — modifica
router.put('/:id', (req, res) => {
  const {
    cliente_nome, cliente_email, cliente_tel,
    tipo_dispositivo, brand, modello, colore_storage, seriale, imei,
    piano_id, piano_nome, durata_mesi, coperture, prezzo, note
  } = req.body

  try {
    req.app.locals.run(`
      UPDATE protezioni SET
        cliente_nome=?, cliente_email=?, cliente_tel=?,
        tipo_dispositivo=?, brand=?, modello=?, colore_storage=?, seriale=?, imei=?,
        piano_id=?, piano_nome=?, durata_mesi=?, coperture=?, prezzo=?, note=?
      WHERE id=?
    `, [
      cliente_nome, cliente_email || '', cliente_tel || '',
      tipo_dispositivo, brand, modello, colore_storage || '', seriale || '', imei || '',
      piano_id, piano_nome, durata_mesi, JSON.stringify(coperture || []), prezzo, note || '',
      req.params.id
    ])

    const p = req.app.locals.get('SELECT * FROM protezioni WHERE id = ?', [req.params.id])
    if (!p) return res.status(404).json({ success: false, error: 'Non trovata' })
    res.json({ success: true, data: { ...p, coperture: JSON.parse(p.coperture || '[]'), stato: statoCalcolato(p.data_scadenza) } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// DELETE /protezioni/:id
router.delete('/:id', (req, res) => {
  try {
    const p = req.app.locals.get('SELECT id FROM protezioni WHERE id = ?', [req.params.id])
    if (!p) return res.status(404).json({ success: false, error: 'Non trovata' })
    req.app.locals.run('DELETE FROM protezioni WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

module.exports = router
