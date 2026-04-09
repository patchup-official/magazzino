// routes/display_ordini.js — Ordini buyback display

const express = require('express')
const router = express.Router()

function genNumOrdine() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `ORD-${y}${m}${d}-${rand}`
}

function initTables(app) {
  const { run } = app.locals
  try {
    run(`CREATE TABLE IF NOT EXISTS display_ordini (
      id TEXT PRIMARY KEY,
      numero TEXT UNIQUE NOT NULL,
      fornitore_id TEXT,
      fornitore_nome TEXT,
      fornitore_email TEXT,
      fornitore_tel TEXT,
      stato TEXT DEFAULT 'aperto',
      totale REAL DEFAULT 0,
      note TEXT,
      pdf_generato_at TEXT,
      inviato_at TEXT,
      pagato_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    run(`CREATE TABLE IF NOT EXISTS display_ordini_items (
      id TEXT PRIMARY KEY,
      ordine_id TEXT NOT NULL,
      brand TEXT NOT NULL,
      modello TEXT NOT NULL,
      quantita INTEGER DEFAULT 1,
      prezzo_unitario REAL NOT NULL,
      prezzo_offerta REAL NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(ordine_id, brand, modello)
    )`)
  } catch(e) {}
}

// ── GET /display-ordini — lista ordini
router.get('/', (req, res) => {
  try {
    const ordini = req.app.locals.query(`
      SELECT o.*, COUNT(i.id) as n_items
      FROM display_ordini o
      LEFT JOIN display_ordini_items i ON o.id = i.ordine_id
      GROUP BY o.id ORDER BY o.created_at DESC
    `)
    res.json({ success: true, data: ordini })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── GET /display-ordini/aperto — ordine aperto corrente
router.get('/aperto', (req, res) => {
  try {
    const ordine = req.app.locals.get(`SELECT * FROM display_ordini WHERE stato = 'aperto' ORDER BY created_at DESC LIMIT 1`)
    if (!ordine) return res.json({ success: true, data: null })
    const items = req.app.locals.query(`SELECT * FROM display_ordini_items WHERE ordine_id = ? ORDER BY brand, modello`, [ordine.id])
    res.json({ success: true, data: { ...ordine, items } })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── GET /display-ordini/:id
router.get('/:id', (req, res) => {
  try {
    const ordine = req.app.locals.get(`SELECT * FROM display_ordini WHERE id = ?`, [req.params.id])
    if (!ordine) return res.status(404).json({ success: false, error: 'Ordine non trovato' })
    const items = req.app.locals.query(`SELECT * FROM display_ordini_items WHERE ordine_id = ? ORDER BY brand, modello`, [ordine.id])
    res.json({ success: true, data: { ...ordine, items } })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── POST /display-ordini — crea ordine
router.post('/', (req, res) => {
  const { fornitore_id, fornitore_nome, fornitore_email, fornitore_tel, note } = req.body
  try {
    const esistente = req.app.locals.get(`SELECT id FROM display_ordini WHERE stato = 'aperto' LIMIT 1`)
    if (esistente) return res.status(409).json({ success: false, error: 'Esiste già un ordine aperto. Chiudilo prima di crearne uno nuovo.' })
    const id = req.app.locals.uid()
    const numero = genNumOrdine()
    req.app.locals.run(`
      INSERT INTO display_ordini (id, numero, fornitore_id, fornitore_nome, fornitore_email, fornitore_tel, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, numero, fornitore_id || null, fornitore_nome || null, fornitore_email || null, fornitore_tel || null, note || null])
    const ordine = req.app.locals.get(`SELECT * FROM display_ordini WHERE id = ?`, [id])
    res.json({ success: true, data: { ...ordine, items: [] } })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── PUT /display-ordini/:id — aggiorna fornitore/note
router.put('/:id', (req, res) => {
  const { fornitore_id, fornitore_nome, fornitore_email, fornitore_tel, note } = req.body
  try {
    req.app.locals.run(`
      UPDATE display_ordini SET fornitore_id=?, fornitore_nome=?, fornitore_email=?, fornitore_tel=?, note=? WHERE id=?
    `, [fornitore_id || null, fornitore_nome || null, fornitore_email || null, fornitore_tel || null, note || null, req.params.id])
    const ordine = req.app.locals.get(`SELECT * FROM display_ordini WHERE id = ?`, [req.params.id])
    const items = req.app.locals.query(`SELECT * FROM display_ordini_items WHERE ordine_id = ? ORDER BY brand, modello`, [req.params.id])
    res.json({ success: true, data: { ...ordine, items } })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── PATCH /display-ordini/:id/stato — aggiorna stato
router.patch('/:id/stato', (req, res) => {
  const { stato } = req.body
  const stati = ['aperto', 'pdf_generato', 'in_attesa_pagamento', 'pagato']
  if (!stati.includes(stato)) return res.status(400).json({ success: false, error: 'Stato non valido' })
  try {
    let extra = ''
    if (stato === 'pdf_generato') extra = `, pdf_generato_at = datetime('now')`
    if (stato === 'in_attesa_pagamento') extra = `, inviato_at = datetime('now')`
    if (stato === 'pagato') extra = `, pagato_at = datetime('now')`
    req.app.locals.run(`UPDATE display_ordini SET stato = ?${extra} WHERE id = ?`, [stato, req.params.id])
    const ordine = req.app.locals.get(`SELECT * FROM display_ordini WHERE id = ?`, [req.params.id])
    res.json({ success: true, data: ordine })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── DELETE /display-ordini/:id — elimina ordine
router.delete('/:id', (req, res) => {
  try {
    req.app.locals.run(`DELETE FROM display_ordini_items WHERE ordine_id = ?`, [req.params.id])
    req.app.locals.run(`DELETE FROM display_ordini WHERE id = ?`, [req.params.id])
    res.json({ success: true })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── POST /display-ordini/:id/items — aggiungi/aggiorna item
router.post('/:id/items', (req, res) => {
  const { brand, modello, quantita, prezzo_unitario, prezzo_offerta, note } = req.body
  if (!brand || !modello || !quantita || !prezzo_unitario) return res.status(400).json({ success: false, error: 'Dati incompleti' })
  try {
    const ordine = req.app.locals.get(`SELECT stato FROM display_ordini WHERE id = ?`, [req.params.id])
    if (!ordine || ordine.stato !== 'aperto') return res.status(400).json({ success: false, error: 'Puoi aggiungere items solo a ordini aperti' })

    const esistente = req.app.locals.get(`SELECT id, quantita FROM display_ordini_items WHERE ordine_id = ? AND brand = ? AND modello = ?`, [req.params.id, brand, modello])
    const itemId = req.app.locals.uid()

    if (esistente) {
      req.app.locals.run(`UPDATE display_ordini_items SET quantita = quantita + ? WHERE id = ?`, [parseInt(quantita), esistente.id])
    } else {
      req.app.locals.run(`
        INSERT INTO display_ordini_items (id, ordine_id, brand, modello, quantita, prezzo_unitario, prezzo_offerta, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [itemId, req.params.id, brand, modello, parseInt(quantita), prezzo_unitario, prezzo_offerta || prezzo_unitario, note || null])
    }

    // Ricalcola totale (basato su prezzo_offerta = quello che offri al cliente)
    req.app.locals.run(`
      UPDATE display_ordini SET totale = (
        SELECT COALESCE(SUM(quantita * prezzo_offerta), 0) FROM display_ordini_items WHERE ordine_id = ?
      ) WHERE id = ?
    `, [req.params.id, req.params.id])

    const items = req.app.locals.query(`SELECT * FROM display_ordini_items WHERE ordine_id = ? ORDER BY brand, modello`, [req.params.id])
    const ordineAggiornato = req.app.locals.get(`SELECT * FROM display_ordini WHERE id = ?`, [req.params.id])
    res.json({ success: true, data: { ...ordineAggiornato, items } })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── PUT /display-ordini/:id/items/:itemId — modifica quantità
router.put('/:id/items/:itemId', (req, res) => {
  const { quantita } = req.body
  if (!quantita || parseInt(quantita) < 1) return res.status(400).json({ success: false, error: 'Quantità non valida' })
  try {
    req.app.locals.run(`UPDATE display_ordini_items SET quantita = ? WHERE id = ? AND ordine_id = ?`, [parseInt(quantita), req.params.itemId, req.params.id])
    req.app.locals.run(`
      UPDATE display_ordini SET totale = (
        SELECT COALESCE(SUM(quantita * prezzo_offerta), 0) FROM display_ordini_items WHERE ordine_id = ?
      ) WHERE id = ?
    `, [req.params.id, req.params.id])
    const items = req.app.locals.query(`SELECT * FROM display_ordini_items WHERE ordine_id = ? ORDER BY brand, modello`, [req.params.id])
    const ordine = req.app.locals.get(`SELECT * FROM display_ordini WHERE id = ?`, [req.params.id])
    res.json({ success: true, data: { ...ordine, items } })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

// ── DELETE /display-ordini/:id/items/:itemId — rimuovi item
router.delete('/:id/items/:itemId', (req, res) => {
  try {
    req.app.locals.run(`DELETE FROM display_ordini_items WHERE id = ? AND ordine_id = ?`, [req.params.itemId, req.params.id])
    req.app.locals.run(`
      UPDATE display_ordini SET totale = (
        SELECT COALESCE(SUM(quantita * prezzo_offerta), 0) FROM display_ordini_items WHERE ordine_id = ?
      ) WHERE id = ?
    `, [req.params.id, req.params.id])
    const items = req.app.locals.query(`SELECT * FROM display_ordini_items WHERE ordine_id = ? ORDER BY brand, modello`, [req.params.id])
    const ordine = req.app.locals.get(`SELECT * FROM display_ordini WHERE id = ?`, [req.params.id])
    res.json({ success: true, data: { ...ordine, items } })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

module.exports = { router, initTables }
