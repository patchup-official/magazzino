// routes/importexport.js

const express = require('express')
const router = express.Router()

// ── Helper CSV ────────────────────────────────────────────────────────────────

function toCSV(rows, columns) {
  if (!rows.length) return columns.join(',') + '\n'
  const header = columns.join(',')
  const lines = rows.map(row =>
    columns.map(col => {
      const val = row[col] ?? ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
    }).join(',')
  )
  return [header, ...lines].join('\n')
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).map(line => {
    const vals = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { vals.push(cur); cur = '' }
      else { cur += ch }
    }
    vals.push(cur)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim() })
    return obj
  })
}

// Normalizza un record cliente da qualsiasi formato CSV
function normalizzaCliente(row) {
  // Gestisce sia il formato interno che quello PatchUP (Nome, Cognome, Ragione Sociale, ecc.)
  const tipoRaw = (row['tipo cliente'] || row['tipo'] || 'Persona Fisica').toLowerCase()
  const tipo = tipoRaw.includes('iva') ? 'partita_iva' : 'persona_fisica'

  return {
    tipo,
    nome: row['nome'] || '',
    cognome: row['cognome'] || '',
    ragione_soc: row['ragione sociale'] || row['ragione_soc'] || '',
    codice_fisc: row['codice fiscale'] || row['codice_fisc'] || '',
    piva: row['piva'] || row['p.iva'] || '',
    telefono: (row['telefono'] || '').replace(/\s/g, ''),
    email: row['email'] || '',
    indirizzo: row['indirizzo'] || '',
    cap: row['cap'] || '',
    citta: row['citta'] || row['città'] || '',
    note: row['note'] || '',
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

router.get('/export/products', (req, res) => {
  const rows = req.app.locals.query('SELECT * FROM products ORDER BY created_at DESC')
  const cols = ['id','nome','categoria','qty','prezzo_acq','prezzo_vend','barcode','note','created_at']
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="prodotti.csv"')
  res.send(toCSV(rows, cols))
})

router.get('/export/devices', (req, res) => {
  const rows = req.app.locals.query('SELECT * FROM devices ORDER BY created_at DESC')
  const cols = ['id','brand','modello','storage','colore','imei','condizione','stato','provenienza','prezzo_acq','prezzo_vend','cliente_nome','cliente_tel','note','created_at']
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="dispositivi.csv"')
  res.send(toCSV(rows, cols))
})

router.get('/export/clienti', (req, res) => {
  const rows = req.app.locals.query('SELECT * FROM clienti ORDER BY created_at DESC')
  const cols = ['id','tipo','nome','cognome','ragione_soc','codice_fisc','piva','telefono','email','indirizzo','cap','citta','note','created_at']
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="clienti.csv"')
  res.send(toCSV(rows, cols))
})

router.get('/export/ricambi', (req, res) => {
  const rows = req.app.locals.query('SELECT * FROM ricambi ORDER BY nome ASC')
  const cols = ['id','nome','categoria','compatibile','qty','qty_minima','prezzo_acq','barcode','note','created_at']
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="ricambi.csv"')
  res.send(toCSV(rows, cols))
})

// ── IMPORT ────────────────────────────────────────────────────────────────────

router.post('/import/products', express.text({ type: 'text/csv', limit: '10mb' }), (req, res) => {
  const { query, run } = req.app.locals
  const rows = parseCSV(req.body)
  let inserted = 0, skipped = 0

  for (const row of rows) {
    if (!row.nome || !row.categoria) { skipped++; continue }
    const existing = query(
      'SELECT id FROM products WHERE nome = ? AND (barcode = ? OR (barcode IS NULL AND ? = ""))',
      [row.nome, row.barcode || '', row.barcode || '']
    )
    if (existing.length) { skipped++; continue }
    try {
      run(`INSERT INTO products (id, nome, categoria, qty, prezzo_acq, prezzo_vend, barcode, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid(), row.nome, row.categoria, +row.qty || 0, +row.prezzo_acq || 0,
         +row.prezzo_vend || 0, row.barcode || null, row.note || null])
      inserted++
    } catch { skipped++ }
  }

  res.json({ success: true, inserted, skipped, total: rows.length })
})

router.post('/import/devices', express.text({ type: 'text/csv', limit: '10mb' }), (req, res) => {
  const { query, run } = req.app.locals
  const rows = parseCSV(req.body)
  let inserted = 0, skipped = 0

  for (const row of rows) {
    if (!row.brand || !row.modello) { skipped++; continue }
    if (row.imei) {
      const existing = query('SELECT id FROM devices WHERE imei = ?', [row.imei])
      if (existing.length) { skipped++; continue }
    }
    try {
      run(`INSERT INTO devices (id, brand, modello, storage, colore, imei, condizione, stato, provenienza, prezzo_acq, prezzo_vend, cliente_nome, cliente_tel, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid(), row.brand, row.modello, row.storage || null, row.colore || null,
         row.imei || null, row.condizione || 'B', row.stato || 'in_stock',
         row.provenienza || 'fornitore', +row.prezzo_acq || 0, +row.prezzo_vend || 0,
         row['cliente_nome'] || null, row['cliente_tel'] || null, row.note || null])
      inserted++
    } catch { skipped++ }
  }

  res.json({ success: true, inserted, skipped, total: rows.length })
})

// Import clienti — supporta sia formato interno che formato PatchUP esterno
router.post('/import/clienti', express.text({ type: 'text/csv', limit: '10mb' }), (req, res) => {
  const { query, run } = req.app.locals
  const rows = parseCSV(req.body)
  let inserted = 0, skipped = 0

  for (const row of rows) {
    const c = normalizzaCliente(row)

    // Per Partita IVA usa ragione_soc come nome se nome è vuoto
    if (!c.nome && !c.ragione_soc) { skipped++; continue }
    const nomeEffettivo = c.nome || c.ragione_soc

    // Controlla duplicato per nome + telefono
    const existing = query(
      'SELECT id FROM clienti WHERE (nome = ? OR ragione_soc = ?) AND telefono = ?',
      [nomeEffettivo, c.ragione_soc || nomeEffettivo, c.telefono]
    )
    if (existing.length) { skipped++; continue }

    try {
      run(`INSERT INTO clienti (id, tipo, nome, cognome, ragione_soc, codice_fisc, piva, telefono, email, indirizzo, cap, citta, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid(), c.tipo, nomeEffettivo, c.cognome, c.ragione_soc,
         c.codice_fisc, c.piva, c.telefono, c.email,
         c.indirizzo, c.cap, c.citta, c.note])
      inserted++
    } catch { skipped++ }
  }

  res.json({ success: true, inserted, skipped, total: rows.length })
})

router.post('/import/ricambi', express.text({ type: 'text/csv', limit: '10mb' }), (req, res) => {
  const { query, run } = req.app.locals
  const rows = parseCSV(req.body)
  let inserted = 0, skipped = 0

  for (const row of rows) {
    if (!row.nome) { skipped++; continue }
    const existing = query(
      'SELECT id FROM ricambi WHERE nome = ? AND (barcode = ? OR (barcode IS NULL AND ? = ""))',
      [row.nome, row.barcode || '', row.barcode || '']
    )
    if (existing.length) { skipped++; continue }
    try {
      run(`INSERT INTO ricambi (id, nome, categoria, compatibile, qty, qty_minima, prezzo_acq, barcode, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid(), row.nome, row.categoria || null, row.compatibile || null,
         +row.qty || 0, +row.qty_minima || 1, +row.prezzo_acq || 0,
         row.barcode || null, row.note || null])
      inserted++
    } catch { skipped++ }
  }

  res.json({ success: true, inserted, skipped, total: rows.length })
})

module.exports = router
