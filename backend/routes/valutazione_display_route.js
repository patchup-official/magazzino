// routes/valutazione_display.js
// Integrazione listino display usati rigenerabili in Magazzino (SQLite)

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// ── Multer setup ─────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads_display')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname).toLowerCase())
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) return cb(new Error('Formato non supportato'))
    cb(null, true)
  }
})

// ── Inizializzazione tabelle ──────────────────────────────────────────────────
function initTables(app) {
  const { run } = app.locals
  try {
    run(`CREATE TABLE IF NOT EXISTS display_listino (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      brand TEXT NOT NULL,
      modello TEXT NOT NULL,
      codice TEXT,
      prezzo_acquisto REAL NOT NULL,
      note TEXT,
      attivo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    run(`CREATE INDEX IF NOT EXISTS idx_display_brand ON display_listino(brand)`)
    run(`CREATE INDEX IF NOT EXISTS idx_display_modello ON display_listino(modello)`)
    run(`CREATE INDEX IF NOT EXISTS idx_display_attivo ON display_listino(attivo)`)

    run(`CREATE TABLE IF NOT EXISTS display_uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      righe INTEGER DEFAULT 0,
      attivo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`)

    run(`CREATE TABLE IF NOT EXISTS display_settings (
      chiave TEXT PRIMARY KEY,
      valore TEXT NOT NULL
    )`)

    // Inserisci margine default se non esiste
    const existing = app.locals.get(`SELECT chiave FROM display_settings WHERE chiave = 'margine_percentuale'`)
    if (!existing) {
      run(`INSERT INTO display_settings (chiave, valore) VALUES ('margine_percentuale', '30')`)
    }
  } catch(e) {
    // tabelle già esistenti, ok
  }
}

// ── Parser Excel/CSV ──────────────────────────────────────────────────────────
async function parseFile(filepath) {
  const ext = path.extname(filepath).toLowerCase()
  const rows = []

  if (ext === '.csv') {
    const content = fs.readFileSync(filepath, 'utf-8')
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) throw new Error('File CSV vuoto')
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
      const row = {}
      header.forEach((h, idx) => row[h] = cols[idx] || '')
      const r = normalizeRow(row)
      if (r) rows.push(r)
    }
    return rows
  }

  // Excel (.xlsx / .xls)
  const XLSX = require('xlsx')
  const wb = XLSX.readFile(filepath)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (raw.length < 2) throw new Error('File Excel vuoto')

  // Rileva formato: fornitore (righe 1-3 intestazioni, riga 4 = header)
  // vs formato interno (riga 1 = header)
  let headerRowIdx = 0
  const firstRowStr = String(raw[0].join(' ')).toLowerCase()
  const isFornitore = firstRowStr.includes('brand') && raw[0].some(c => String(c).toLowerCase().includes('modello'))
    ? false
    : raw.length > 3 && String(raw[3].join(' ')).toLowerCase().includes('brand')

  if (isFornitore) {
    headerRowIdx = 3
    console.log('Rilevato formato fornitore (header riga 4)')
  }

  const header = raw[headerRowIdx].map(h => String(h).toLowerCase().trim())

  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const cols = raw[i]
    const row = {}
    header.forEach((h, idx) => row[h] = String(cols[idx] || '').trim())
    const r = normalizeRow(row, isFornitore)
    if (r) rows.push(r)
  }

  return rows
}

function normalizeRow(row, isFornitore = false) {
  // Mappa colonne possibili
  const brand = row['marca'] || row['brand'] || row['marchio'] || ''

  // Colonna modello: cerca chiave esatta o qualsiasi chiave che contiene 'modell' o 'buyback'
  let modello = row['modello'] || row['model'] || row['nome'] || ''
  if (!modello) {
    const modelKey = Object.keys(row).find(k => k.includes('modell') || k.includes('buyback') || k.includes('recent'))
    if (modelKey) modello = row[modelKey] || ''
  }

  // Prezzo: cerca chiave esatta o qualsiasi chiave che contiene 'prezzo' o 'price'
  let prezzoRaw = row['prezzo acquisto'] || row['prezzo ivato/price'] || row['prezzo ivato']
    || row['prezzo'] || row['price'] || row['costo'] || ''
  if (!prezzoRaw) {
    const priceKey = Object.keys(row).find(k => k.includes('prezzo') || (k.includes('price') && !k.includes('pezzi')))
    if (priceKey) prezzoRaw = row[priceKey] || '0'
  }
  if (!prezzoRaw) prezzoRaw = '0'

  // Rimuovi simboli valuta e normalizza separatore decimale
  prezzoRaw = String(prezzoRaw).replace(/[€$£\s]/g, '').replace(',', '.')
  const prezzo = parseFloat(prezzoRaw)

  if (!brand || !modello || isNaN(prezzo) || prezzo <= 0) return null

  return {
    brand: capitalizeFirst(brand.trim()),
    modello: modello.trim(),
    codice: row['codice'] || row['code'] || row['sku'] || '',
    prezzo_acquisto: prezzo,
    note: row['note'] || row['notes'] || row['descrizione'] || '',
  }
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ── GET /valutazione-display/settings ────────────────────────────────────────
router.get('/settings', (req, res) => {
  try {
    const settings = req.app.locals.query('SELECT chiave, valore FROM display_settings')
    const obj = {}
    settings.forEach(s => obj[s.chiave] = s.valore)
    res.json({ success: true, data: obj })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── PUT /valutazione-display/settings ────────────────────────────────────────
router.put('/settings', (req, res) => {
  const { margine_percentuale } = req.body
  try {
    req.app.locals.run(
      `INSERT OR REPLACE INTO display_settings (chiave, valore) VALUES ('margine_percentuale', ?)`,
      [String(margine_percentuale)]
    )
    res.json({ success: true })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── GET /valutazione-display/brands ──────────────────────────────────────────
router.get('/brands', (req, res) => {
  try {
    const brands = req.app.locals.query(
      `SELECT DISTINCT brand, COUNT(*) as count FROM display_listino WHERE attivo = 1 GROUP BY brand ORDER BY brand`
    )
    res.json({ success: true, data: brands })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── GET /valutazione-display/search ──────────────────────────────────────────
router.get('/search', (req, res) => {
  const { q, brand } = req.query
  try {
    const margineRow = req.app.locals.get(`SELECT valore FROM display_settings WHERE chiave = 'margine_percentuale'`)
    const margine = parseFloat(margineRow?.valore || '30') / 100

    let sql = `SELECT * FROM display_listino WHERE attivo = 1`
    const params = []

    if (brand && brand !== 'all') {
      sql += ` AND brand = ?`
      params.push(brand)
    }
    if (q) {
      sql += ` AND (brand LIKE ? OR modello LIKE ? OR codice LIKE ?)`
      const like = `%${q}%`
      params.push(like, like, like)
    }
    sql += ` ORDER BY brand, modello LIMIT 100`

    const rows = req.app.locals.query(sql, params)
    const result = rows.map(r => ({
      ...r,
      prezzo_vendita: parseFloat((r.prezzo_acquisto * (1 + margine)).toFixed(2)),
      margine_applicato: margine * 100,
    }))

    res.json({ success: true, data: result, totale: result.length })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── GET /valutazione-display/stats ───────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const totale = req.app.locals.get(`SELECT COUNT(*) as n FROM display_listino WHERE attivo = 1`)?.n || 0
    const brands = req.app.locals.get(`SELECT COUNT(DISTINCT brand) as n FROM display_listino WHERE attivo = 1`)?.n || 0
    const uploads = req.app.locals.get(`SELECT COUNT(*) as n FROM display_uploads`)?.n || 0
    const ultimo = req.app.locals.get(`SELECT created_at FROM display_uploads ORDER BY created_at DESC LIMIT 1`)
    res.json({ success: true, data: { totale, brands, uploads, ultimo_aggiornamento: ultimo?.created_at || null } })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── GET /valutazione-display/uploads ─────────────────────────────────────────
router.get('/uploads', (req, res) => {
  try {
    const uploads = req.app.locals.query(`SELECT * FROM display_uploads ORDER BY created_at DESC`)
    res.json({ success: true, data: uploads })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── POST /valutazione-display/upload ─────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Nessun file ricevuto' })

  const { uid, run, query } = req.app.locals
  const uploadId = uid()

  try {
    // Se xlsx non disponibile, installalo dinamicamente
    try { require('xlsx') } catch(e) {
      const { execSync } = require('child_process')
      execSync('npm install xlsx --save', { cwd: path.join(__dirname, '..') })
    }

    const rows = await parseFile(req.file.path)
    if (rows.length === 0) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ success: false, error: 'Nessun dato valido trovato nel file. Verifica le colonne: Marca, Modello, Prezzo Acquisto.' })
    }

    // Salva upload record
    run(`INSERT INTO display_uploads (id, filename, righe) VALUES (?, ?, ?)`,
      [uploadId, req.file.originalname, rows.length])

    // Inserisci righe (non attivo ancora)
    rows.forEach(r => {
      run(`INSERT INTO display_listino (id, upload_id, brand, modello, codice, prezzo_acquisto, note, attivo) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [uid(), uploadId, r.brand, r.modello, r.codice || '', r.prezzo_acquisto, r.note || ''])
    })

    // Pulisci file temporaneo
    try { fs.unlinkSync(req.file.path) } catch(e) {}

    res.json({ success: true, data: { upload_id: uploadId, righe: rows.length, anteprima: rows.slice(0, 5) } })
  } catch(e) {
    try { fs.unlinkSync(req.file.path) } catch(ex) {}
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── PATCH /valutazione-display/uploads/:id/activate ──────────────────────────
router.patch('/uploads/:id/activate', (req, res) => {
  const { run } = req.app.locals
  try {
    // Disattiva tutto
    run(`UPDATE display_listino SET attivo = 0`)
    run(`UPDATE display_uploads SET attivo = 0`)
    // Attiva questo upload
    run(`UPDATE display_listino SET attivo = 1 WHERE upload_id = ?`, [req.params.id])
    run(`UPDATE display_uploads SET attivo = 1 WHERE id = ?`, [req.params.id])
    const righe = req.app.locals.get(`SELECT COUNT(*) as n FROM display_listino WHERE attivo = 1`)?.n || 0
    res.json({ success: true, righe_attive: righe })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ── DELETE /valutazione-display/uploads/:id ───────────────────────────────────
router.delete('/uploads/:id', (req, res) => {
  const { run } = req.app.locals
  try {
    run(`DELETE FROM display_listino WHERE upload_id = ?`, [req.params.id])
    run(`DELETE FROM display_uploads WHERE id = ?`, [req.params.id])
    res.json({ success: true })
  } catch(e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

module.exports = { router, initTables }
