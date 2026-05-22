const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';

/**
 * Verifica il token JWT nell'header Authorization.
 * Aggiunge req.user = { id, role, store_id, username } se valido.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, store_id, username, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token scaduto' });
    }
    return res.status(401).json({ error: 'Token non valido' });
  }
}

/**
 * Richiede uno o più ruoli specifici.
 * Uso: requireRole('SUPER_ADMIN') oppure requireRole('ADMIN', 'SUPER_ADMIN')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accesso negato. Ruolo richiesto: ${roles.join(' o ')}`,
      });
    }
    next();
  };
}

/**
 * Garantisce che ADMIN e OPERATOR vedano solo i dati del proprio store.
 * SUPER_ADMIN può passare qualsiasi store_id via query param ?store_id=xxx.
 */
function injectStoreFilter(req, res, next) {
  if (req.user.role === 'SUPER_ADMIN') {
    // SUPER_ADMIN può filtrare per store opzionalmente
    req.storeFilter = req.query.store_id || null;
  } else {
    // ADMIN e OPERATOR vedono solo il proprio store
    if (!req.user.store_id) {
      return res.status(403).json({ error: 'Utente non associato a nessuno store' });
    }
    req.storeFilter = req.user.store_id;
  }
  next();
}

module.exports = { verifyToken, requireRole, injectStoreFilter, JWT_SECRET };
