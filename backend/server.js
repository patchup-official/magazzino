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

  try { db.run('ALTER TABLE products ADD COLUMN barcode TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE products ADD COLUMN fornitore_id TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE products ADD COLUMN note TEXT'); } catch(e) {}

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

  // Piani protezione
  try {
    db.run(`CREATE TABLE IF NOT EXISTS piani_protezione (
      id TEXT PRIMARY KEY, nome TEXT NOT NULL, prezzo REAL NOT NULL,
      durata_mesi INTEGER NOT NULL, coperture TEXT NOT NULL,
      consigliato INTEGER DEFAULT 0, attivo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    const piani = db.prepare('SELECT COUNT(*) as n FROM piani_protezione').getAsObject();
    if (!piani.n) {
      db.run(`INSERT INTO piani_protezione (id,nome,prezzo,durata_mesi,coperture,consigliato) VALUES
        ('piano_base','Base',7.90,6,'["Garanzia estesa","Rottura schermo"]',0),
        ('piano_premium','Premium',12.90,12,'["Garanzia estesa","Danni accidentali","Rottura schermo","Sostituzione pezzi"]',1),
        ('piano_elite','Elite',19.90,24,'["Garanzia estesa","Danni accidentali","Rottura schermo","Sostituzione pezzi","Furto e smarrimento","Assistenza prioritaria"]',0)
      `);
    }
  } catch(e) {}

  // Protezioni
  try {
    db.run(`CREATE TABLE IF NOT EXISTS protezioni (
      id TEXT PRIMARY KEY, certificato TEXT UNIQUE NOT NULL,
      cliente_id TEXT, cliente_nome TEXT NOT NULL, cliente_email TEXT, cliente_tel TEXT,
      tipo_dispositivo TEXT NOT NULL, brand TEXT NOT NULL, modello TEXT NOT NULL,
      colore_storage TEXT, seriale TEXT, imei TEXT,
      piano_id TEXT NOT NULL, piano_nome TEXT NOT NULL, durata_mesi INTEGER NOT NULL,
      coperture TEXT NOT NULL, prezzo REAL NOT NULL,
      data_inizio TEXT DEFAULT (date('now')), data_scadenza TEXT NOT NULL,
      stato TEXT DEFAULT 'attiva', note TEXT, riparazione_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_protezioni_cliente ON protezioni(cliente_nome)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_protezioni_stato ON protezioni(stato)`);
  } catch(e) {}

  // Display Ordini (buyback)
  try {
    db.run(`CREATE TABLE IF NOT EXISTS display_ordini (
      id TEXT PRIMARY KEY, numero TEXT UNIQUE NOT NULL,
      fornitore_id TEXT, fornitore_nome TEXT, fornitore_email TEXT, fornitore_tel TEXT,
      stato TEXT DEFAULT 'aperto', totale REAL DEFAULT 0, note TEXT,
      pdf_generato_at TEXT, inviato_at TEXT, pagato_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    db.run(`CREATE TABLE IF NOT EXISTS display_ordini_items (
      id TEXT PRIMARY KEY, ordine_id TEXT NOT NULL,
      brand TEXT NOT NULL, modello TEXT NOT NULL,
      quantita INTEGER DEFAULT 1, prezzo_unitario REAL NOT NULL, prezzo_offerta REAL NOT NULL,
      note TEXT, created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(ordine_id, brand, modello)
    )`)
  } catch(e) {}

  // Valutazione Display
  try {
    db.run(`CREATE TABLE IF NOT EXISTS display_listino (
      id TEXT PRIMARY KEY, upload_id TEXT NOT NULL,
      brand TEXT NOT NULL, modello TEXT NOT NULL, codice TEXT,
      prezzo_acquisto REAL NOT NULL, note TEXT,
      attivo INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_display_brand ON display_listino(brand)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_display_modello ON display_listino(modello)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_display_attivo ON display_listino(attivo)`);
    db.run(`CREATE TABLE IF NOT EXISTS display_uploads (
      id TEXT PRIMARY KEY, filename TEXT NOT NULL, righe INTEGER DEFAULT 0,
      attivo INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS display_settings (
      chiave TEXT PRIMARY KEY, valore TEXT NOT NULL
    )`);
    const ms = db.prepare("SELECT chiave FROM display_settings WHERE chiave = 'margine_percentuale'").getAsObject();
    if (!ms.chiave) {
      db.run(`INSERT INTO display_settings (chiave, valore) VALUES ('margine_percentuale', '30')`);
    }
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
  app.use('/products',            require('./routes/products'));
  app.use('/devices',             require('./routes/devices'));
  app.use('/repairs',             require('./routes/repairs'));
  app.use('/purchases',           require('./routes/purchases'));
  app.use('/imei',                require('./routes/imei'));
  app.use('/valutazione',         require('./routes/valutazione'));
  app.use('/fornitori',           require('./routes/fornitori'));
  app.use('/interventi',          require('./routes/interventi'));
  app.use('/ricambi',             require('./routes/ricambi'));
  app.use('/servizi',             require('./routes/servizi'));
  app.use('/clienti',             require('./routes/clienti'));
  app.use('/importexport',        require('./routes/importexport'));
  app.use('/protezioni',          require('./routes/protezioni'));
  app.use('/piani',               require('./routes/piani'));

  // Valutazione Display — router estratto dal modulo
  const valDisplay = require('./routes/valutazione_display');
  app.use('/valutazione-display', valDisplay.router);

  // Display Ordini Buyback
  const displayOrdini = require('./routes/display_ordini_route');
  app.use('/display-ordini', displayOrdini.router);

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok', version: '2.6.0',
      products:   app.locals.get('SELECT COUNT(*) as n FROM products')?.n   || 0,
      devices:    app.locals.get('SELECT COUNT(*) as n FROM devices')?.n    || 0,
      repairs:    app.locals.get('SELECT COUNT(*) as n FROM repairs')?.n    || 0,
      clienti:    app.locals.get('SELECT COUNT(*) as n FROM clienti')?.n    || 0,
      protezioni: app.locals.get('SELECT COUNT(*) as n FROM protezioni')?.n || 0,
      display:    app.locals.get('SELECT COUNT(*) as n FROM display_listino WHERE attivo=1')?.n || 0,
    });
  });

  app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status||500).json({ error: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Magazzino API v2.6 → port ${PORT}`));
}).catch(err => { console.error(err); process.exit(1); });
