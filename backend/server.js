// =============================================
// MAGAZZINO - Backend Server (Express + SQLite)
// Pronto per deploy su Render.com
// =============================================

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS: localhost in dev, URL Render in produzione ──
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

// ── Database ──────────────────────────────────
const DB_DIR  = process.env.DB_DIR || path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'magazzino.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

app.locals.db = db;
app.locals.uid = () => crypto.randomBytes(8).toString('hex');

console.log('✅ DB:', DB_PATH);

// ── Routes ───────────────────────────────────
app.use('/products',  require('./routes/products'));
app.use('/devices',   require('./routes/devices'));
app.use('/repairs',   require('./routes/repairs'));
app.use('/purchases', require('./routes/purchases'));

// ── Health ───────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok', version: "2.0.0"',
    products: db.prepare('SELECT COUNT(*) as n FROM products').get().n,
    devices:  db.prepare('SELECT COUNT(*) as n FROM devices').get().n,
    repairs:  db.prepare('SELECT COUNT(*) as n FROM repairs').get().n,
  });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Magazzino API → port ${PORT}`));
