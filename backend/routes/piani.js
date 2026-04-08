// routes/piani.js — Piani protezione configurabili

const express = require('express')
const router = express.Router()

// GET /piani — lista piani
router.get('/', (req, res) => {
  try {
    const piani = req.app.locals.query('SELECT * FROM piani_protezione WHERE attivo = 1 ORDER BY prezzo ASC')
    res.json({ success: true, data: piani.map(p => ({ ...p, coperture: JSON.parse(p.coperture || '[]') })) })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// GET /piani/:id
router.get('/:id', (req, res) => {
  try {
    const p = req.app.locals.get('SELECT * FROM piani_protezione WHERE id = ?', [req.params.id])
    if (!p) return res.status(404).json({ success: false, error: 'Piano non trovato' })
    res.json({ success: true, data: { ...p, coperture: JSON.parse(p.coperture || '[]') } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// POST /piani — crea piano
router.post('/', (req, res) => {
  const { nome, prezzo, durata_mesi, coperture, consigliato } = req.body
  if (!nome || !prezzo || !durata_mesi) return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' })
  try {
    const id = 'piano_' + req.app.locals.uid()
    req.app.locals.run(
      `INSERT INTO piani_protezione (id, nome, prezzo, durata_mesi, coperture, consigliato) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nome, prezzo, durata_mesi, JSON.stringify(coperture || []), consigliato ? 1 : 0]
    )
    const p = req.app.locals.get('SELECT * FROM piani_protezione WHERE id = ?', [id])
    res.json({ success: true, data: { ...p, coperture: JSON.parse(p.coperture || '[]') } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// PUT /piani/:id — modifica piano
router.put('/:id', (req, res) => {
  const { nome, prezzo, durata_mesi, coperture, consigliato, attivo } = req.body
  try {
    req.app.locals.run(
      `UPDATE piani_protezione SET nome=?, prezzo=?, durata_mesi=?, coperture=?, consigliato=?, attivo=? WHERE id=?`,
      [nome, prezzo, durata_mesi, JSON.stringify(coperture || []), consigliato ? 1 : 0, attivo !== false ? 1 : 0, req.params.id]
    )
    const p = req.app.locals.get('SELECT * FROM piani_protezione WHERE id = ?', [req.params.id])
    res.json({ success: true, data: { ...p, coperture: JSON.parse(p.coperture || '[]') } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// DELETE /piani/:id — disattiva piano
router.delete('/:id', (req, res) => {
  try {
    req.app.locals.run('UPDATE piani_protezione SET attivo = 0 WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

module.exports = router
