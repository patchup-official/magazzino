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

  console.log('✅ DB:', DB_PATH);
}

initDB().then(() => {
  app.use('/products',    require('./routes/products'));
  app.use('/devices',     require('./routes/devices'));
  app.use('/repairs',     require('./routes/repairs'));
  app.use('/purchases',   require('./routes/purchases'));
  app.use('/imei',        require('./routes/imei'));
  app.use('/valutazione', require('./routes/valutazione'));
  app.use('/fornitori',   require('./routes/fornitori'));
  app.use('/interventi',  require('./routes/interventi'));
  app.use('/ricambi',     require('./routes/ricambi'));
  app.use('/servizi',     require('./routes/servizi'));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok', version: '2.2.0',
      products:  app.locals.get('SELECT COUNT(*) as n FROM products')?.n  || 0,
      devices:   app.locals.get('SELECT COUNT(*) as n FROM devices')?.n   || 0,
      repairs:   app.locals.get('SELECT COUNT(*) as n FROM repairs')?.n   || 0,
      fornitori: app.locals.get('SELECT COUNT(*) as n FROM fornitori')?.n || 0,
      servizi:   app.locals.get('SELECT COUNT(*) as n FROM servizi')?.n   || 0,
    });
  });

  app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status||500).json({ error: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Magazzino API v2.1 → port ${PORT}`));
}).catch(err => { console.error(err); process.exit(1); });
