// backend/routes/clienti.js


const express = require('express')
const router = express.Router()


// GET /clienti - Lista clienti con ricerca
router.get('/', (req, res) => {
  const { query } = req.app.locals
  const { q, search, tipo } = req.query
const term = q || search
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
    res.json(clienti)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})


// GET /clienti/:id - Singolo cliente
router.get('/:id', (req, res) => {
  try {
