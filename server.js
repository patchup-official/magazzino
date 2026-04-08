const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

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

const DB_DIR  = process.env.DB_DIR || path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'magazzino.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

  // Aggiunge colonne a products se non esistono (ALTER TABLE sicuro)
  try { db.run('ALTER TABLE products ADD COLUMN barcode TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE products ADD COLUMN fornitore_id TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE products ADD COLUMN note TEXT'); } catch(e) {}

  // Migration sicura — tabella servizi
  try {
    db.run(`CREATE TABLE IF NOT EXISTS servizi (
      id TEXT PRIMARY KEY, cliente TEXT NOT NULL, telefono TEXT,
      dispositivo TEXT NOT NULL, tipo_servizio TEXT NOT NULL, nome_servizio TEXT NOT NULL,
      descrizione TEXT, priorita TEXT DEFAULT 'normale', prezzo REAL NOT NULL,
      note TEXT, data_richiesta TEXT DEFAULT (date('now')),
      data_consegna_prevista TEXT, stato TEXT DEFAULT 'in_corso',
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  } catch(e) {}

  // Migration sicura — tabella clienti
  try {
    db.run(`CREATE TABLE IF NOT EXISTS clienti (
      id TEXT PRIMARY KEY, tipo TEXT NOT NULL DEFAULT 'persona_fisica',
      nome TEXT NOT NULL, cognome TEXT, ragione_soc TEXT,
      codice_fisc TEXT, piva TEXT, telefono TEXT, email TEXT,
      indirizzo TEXT, cap TEXT, citta TEXT, note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_clienti_nome ON clienti(nome)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_clienti_tel ON clienti(telefono)`);
  } catch(e) {}

  app.locals.saveDB = () => {
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  };
  app.locals.query = (sql, params=[]) => {
    const stmt = db.prepare(sql); stmt.bind(params);
    const rows = []; while(stmt.step()) rows.push(stmt.getAsObject());
    stmt.free(); return rows;
  };
  app.locals.run = (sql, params=[]) => { db.run(sql, params); app.locals.saveDB(); };
  app.locals.get = (sql, params=[]) => { const r = app.locals.query(sql, params); return r[0]||null; };
  app.locals.uid = () => crypto.randomBytes(8).toString('hex');

  app.locals.saveDB();
  console.log('✅ DB:', DB_PATH);
}

initDB().then(() => {
  app.use('/products',      require('./routes/products'));
  app.use('/devices',       require('./routes/devices'));
  app.use('/repairs',       require('./routes/repairs'));
  app.use('/purchases',     require('./routes/purchases'));
  app.use('/imei',          require('./routes/imei'));
  app.use('/valutazione',   require('./routes/valutazione'));
  app.use('/fornitori',     require('./routes/fornitori'));
  app.use('/interventi',    require('./routes/interventi'));
  app.use('/ricambi',       require('./routes/ricambi'));
  app.use('/servizi',       require('./routes/servizi'));
  app.use('/clienti',       require('./routes/clienti'));
  app.use('/importexport',  require('./routes/importexport'));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok', version: '2.3.0',
      products:  app.locals.get('SELECT COUNT(*) as n FROM products')?.n  || 0,
      devices:   app.locals.get('SELECT COUNT(*) as n FROM devices')?.n   || 0,
      repairs:   app.locals.get('SELECT COUNT(*) as n FROM repairs')?.n   || 0,
      fornitori: app.locals.get('SELECT COUNT(*) as n FROM fornitori')?.n || 0,
      servizi:   app.locals.get('SELECT COUNT(*) as n FROM servizi')?.n   || 0,
      clienti:   app.locals.get('SELECT COUNT(*) as n FROM clienti')?.n   || 0,
    });
  });

  app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status||500).json({ error: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Magazzino API v2.3 → port ${PORT}`));
}).catch(err => { console.error(err); process.exit(1); });
