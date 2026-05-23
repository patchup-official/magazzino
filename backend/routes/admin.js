const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { verifyToken, requireRole } = require('../middleware/auth')

router.use(verifyToken, requireRole('SUPER_ADMIN'))

router.get('/stores', async (req, res) => {
  try {
    const db = req.app.locals.pgPool
    const result = await db.query(
      `SELECT s.*, COUNT(u.id) as operators_count FROM mg_stores s
       LEFT JOIN mg_users u ON u.store_id = s.id AND u.role = 'OPERATOR'
       GROUP BY s.id ORDER BY s.name`
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: 'Errore interno' }) }
})

router.post('/stores', async (req, res) => {
  const { name, city } = req.body
  if (!name || !city) return res.status(400).json({ error: 'name e city obbligatori' })
  try {
    const db = req.app.locals.pgPool
    // Genera codice automatico: prime 2 lettere nome store + contatore
    const prefix = name.trim().replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() || 'ST'
    const count = await db.query('SELECT COUNT(*) FROM mg_stores')
    const num = String(parseInt(count.rows[0].count) + 1).padStart(2, '0')
    let code = prefix + num
    // Assicura unicità
    const exists = await db.query('SELECT id FROM mg_stores WHERE code = $1', [code])
    if (exists.rows.length) code = prefix + String(Date.now()).slice(-3)
    const result = await db.query(
      `INSERT INTO mg_stores (name, city, code) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), city.trim(), code]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Store già esistente' })
    res.status(500).json({ error: 'Errore interno' })
  }
})

router.patch('/stores/:id', async (req, res) => {
  const { name, city, code, active } = req.body
  try {
    const result = await req.app.locals.pgPool.query(
      `UPDATE mg_stores SET name=COALESCE($1,name), city=COALESCE($2,city), code=COALESCE($3,code), active=COALESCE($4,active), updated_at=now() WHERE id=$5 RETURNING *`,
      [name, city, code?.toUpperCase(), active, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Store non trovato' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: 'Errore interno' }) }
})

router.delete('/stores/:id', async (req, res) => {
  try {
    await req.app.locals.pgPool.query('DELETE FROM mg_stores WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: 'Errore interno' }) }
})

router.get('/users', async (req, res) => {
  try {
    const result = await req.app.locals.pgPool.query(
      `SELECT u.id, u.name, u.username, u.role, u.active, u.created_at, s.name as store_name, s.code as store_code
       FROM mg_users u LEFT JOIN mg_stores s ON s.id = u.store_id
       WHERE u.role != 'SUPER_ADMIN' ORDER BY u.role, s.name, u.name`
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: 'Errore interno' }) }
})

router.post('/users', async (req, res) => {
  const { name, username, password, store_id } = req.body
  if (!name || !username || !password || !store_id) return res.status(400).json({ error: 'Tutti i campi obbligatori' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const result = await req.app.locals.pgPool.query(
      `INSERT INTO mg_users (name, username, password_hash, role, store_id) VALUES ($1,$2,$3,'ADMIN',$4) RETURNING id,name,username,role,store_id,active,created_at`,
      [name.trim(), username.toLowerCase().trim(), hash, store_id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username già in uso' })
    res.status(500).json({ error: 'Errore interno' })
  }
})

router.patch('/users/:id', async (req, res) => {
  const { name, username, password, active, store_id } = req.body
  try {
    let hash = null
    if (password) hash = await bcrypt.hash(password, 10)
    const result = await req.app.locals.pgPool.query(
      `UPDATE mg_users SET name=COALESCE($1,name), username=COALESCE($2,username), password_hash=COALESCE($3,password_hash), active=COALESCE($4,active), store_id=COALESCE($5,store_id), updated_at=now() WHERE id=$6 AND role!='SUPER_ADMIN' RETURNING id,name,username,role,store_id,active`,
      [name, username?.toLowerCase(), hash, active, store_id, req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Utente non trovato' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: 'Errore interno' }) }
})

router.delete('/users/:id', async (req, res) => {
  try {
    await req.app.locals.pgPool.query(`DELETE FROM mg_users WHERE id=$1 AND role!='SUPER_ADMIN'`, [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: 'Errore interno' }) }
})

module.exports = router
