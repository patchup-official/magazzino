const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'magazzino-jwt-secret-2026'

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token mancante' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token scaduto' })
    return res.status(401).json({ error: 'Token non valido' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non autenticato' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: `Accesso negato. Ruolo richiesto: ${roles.join(' o ')}` })
    next()
  }
}

function injectStoreFilter(req, res, next) {
  if (req.user.role === 'SUPER_ADMIN') {
    req.storeFilter = req.query.store_id || null
  } else {
    if (!req.user.store_id) return res.status(403).json({ error: 'Utente non associato a nessuno store' })
    req.storeFilter = req.user.store_id
  }
  next()
}

module.exports = { verifyToken, requireRole, injectStoreFilter, JWT_SECRET }
