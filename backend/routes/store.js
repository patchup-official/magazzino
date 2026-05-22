const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');

// Tutte le route richiedono token + ruolo ADMIN o SUPER_ADMIN
router.use(verifyToken, requireRole('ADMIN', 'SUPER_ADMIN'));

// GET /store/operators — lista operatori del proprio store
router.get('/operators', async (req, res) => {
  try {
    const db = req.app.locals.pgPool;
    // SUPER_ADMIN può passare ?store_id=xxx, ADMIN vede solo il suo
    const storeId = req.user.role === 'SUPER_ADMIN'
      ? (req.query.store_id || null)
      : req.user.store_id;

    if (!storeId) return res.status(400).json({ error: 'store_id obbligatorio' });

    const result = await db.query(
      `SELECT id, name, username, role, active, created_at
       FROM users
       WHERE store_id = $1 AND role = 'OPERATOR'
       ORDER BY name`,
      [storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

// POST /store/operators — crea nuovo operatore
router.post('/operators', async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'name, username e password obbligatori' });
  }

  // ADMIN può creare solo nel proprio store
  const storeId = req.user.role === 'SUPER_ADMIN'
    ? (req.body.store_id || req.user.store_id)
    : req.user.store_id;

  if (!storeId) return res.status(400).json({ error: 'store_id obbligatorio' });

  try {
    const db = req.app.locals.pgPool;
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, username, password_hash, role, store_id)
       VALUES ($1, $2, $3, 'OPERATOR', $4)
       RETURNING id, name, username, role, store_id, active, created_at`,
      [name.trim(), username.toLowerCase().trim(), hash, storeId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username già in uso' });
    }
    res.status(500).json({ error: 'Errore interno' });
  }
});

// PATCH /store/operators/:id — modifica operatore
router.patch('/operators/:id', async (req, res) => {
  const { name, username, password, active } = req.body;
  try {
    const db = req.app.locals.pgPool;

    // Verifica che l'operatore appartenga allo store dell'admin
    const check = await db.query(
      `SELECT id FROM users WHERE id = $1 AND store_id = $2 AND role = 'OPERATOR'`,
      [req.params.id, req.user.store_id]
    );
    if (!check.rows[0] && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Operatore non nel tuo store' });
    }

    let hash = null;
    if (password) hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `UPDATE users
       SET name          = COALESCE($1, name),
           username      = COALESCE($2, username),
           password_hash = COALESCE($3, password_hash),
           active        = COALESCE($4, active),
           updated_at    = now()
       WHERE id = $5 AND role = 'OPERATOR'
       RETURNING id, name, username, role, store_id, active`,
      [name, username?.toLowerCase(), hash, active, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Operatore non trovato' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

// DELETE /store/operators/:id
router.delete('/operators/:id', async (req, res) => {
  try {
    const db = req.app.locals.pgPool;
    const check = await db.query(
      `SELECT id FROM users WHERE id = $1 AND store_id = $2 AND role = 'OPERATOR'`,
      [req.params.id, req.user.store_id]
    );
    if (!check.rows[0] && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Operatore non nel tuo store' });
    }
    await db.query(`DELETE FROM users WHERE id = $1 AND role = 'OPERATOR'`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

module.exports = router;
