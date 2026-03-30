// =============================================
// MAGAZZINO - Backend Server
// usa sql.js (SQLite puro JS, nessuna compilazione)
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS non consentito: ' + origin));
  },
  credentials: true,
}));
app.use(express.json());

// ── DATABASE con sql.js ───────────────────────
let db;

async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  const DB_DIR = process.env.DB_DIR || path.join(__dirname, 'db');
  const DB_PATH = path.join(DB_DIR, 'magazzino.sqlite');

  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  // Carica DB esistente o creane uno nuovo
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('✅ DB caricato:', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('✅ Nuovo DB creato:', DB_PATH);
  }

  // Applica schema
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf-8');
  db.run(schema);

  // Salva su disco dopo ogni operazione write
  app.locals.saveDB = () => {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  // Helper: esegui query e ritorna array di oggetti
  app.locals.query = (sql, params = []) => {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  };

  // Helper: esegui INSERT/UPDATE/DELETE
  app.locals.run = (sql, params = []) => {
    db.run(sql, params);
    app.locals.saveDB();
  };

  // Helper: ritorna singola riga
  app.locals.get = (sql, params = []) => {
    const rows = app.locals.query(sql, params);
    return rows[0] || null;
  };

  app.locals.uid = () => crypto.randomBytes(8).toString('hex');

  return db;
}

// ── Avvio ─────────────────────────────────────
initDB().then(() => {

  app.use('/products',  require('./routes/products'));
  app.use('/devices',   require('./routes/devices'));
  app.use('/repairs',   require('./routes/repairs'));
  app.use('/purchases', require('./routes/purchases'));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '2.0.0',
      products: app.locals.get('SELECT COUNT(*) as n FROM products')?.n || 0,
      devices:  app.locals.get('SELECT COUNT(*) as n FROM devices')?.n || 0,
      repairs:  app.locals.get('SELECT COUNT(*) as n FROM repairs')?.n || 0,
    });
  });

  app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status || 500).json({ error: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Magazzino API → port ${PORT}`);
  });

}).catch(err => {
  console.error('Errore avvio DB:', err);
  process.exit(1);
});
