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

const DB_DIR = process.env.DB_DIR || path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'magazzino.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const initSqlJs = require('sql.js');
let SQL, db;

(async () => {
    try {
          SQL = await initSqlJs({
                  locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
          });

      if (fs.existsSync(DB_PATH)) {
              const data = fs.readFileSync(DB_PATH);
              db = new SQL.Database(data);
      } else {
              db = new SQL.Database();
      }

      if (fs.existsSync(SCHEMA_PATH)) {
              const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
              db.exec(schema);
              saveDB();
      }

      console.log('Database inizializzato');
    } catch (err) {
          console.error('Errore database:', err);
    }
})();

function saveDB() {
    try {
          if (db) {
                  const data = db.export();
                  fs.writeFileSync(DB_PATH, data);
          }
    } catch (err) {
          console.error('Errore salvataggio DB:', err);
    }
}

// Routes
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/products', require('./routes/products'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/fornitori', require('./routes/fornitori'));
app.use('/api/servizi', require('./routes/servizi'));

// Health endpoint
app.get('/health', (req, res) => {
    try {
          const productsStmt = db.prepare('SELECT COUNT(*) as count FROM products');
          const devicesStmt = db.prepare('SELECT COUNT(*) as count FROM devices'); 
      const repairsStmt = db.prepare('SELECT COUNT(*) as count FROM repairs');
          const fornitoriStmt = db.prepare('SELECT COUNT(*) as count FROM fornitori');
          const serviziStmt = db.prepare('SELECT COUNT(*) as count FROM servizi');

      res.json({
              status: 'ok',
              version: '2.2.0',
              products: productsStmt.get().count,
              devices: devicesStmt.get().count,
              repairs: repairsStmt.get().count,
              fornitori: fornitoriStmt.get().count,
              servizi: serviziStmt.get().count
      });
    } catch (err) {
          res.status(500).json({ 
                                     status: 'error', 
                  version: '2.2.0', 
                  message: err.message 
          });
    }
});

// IMEI lookup proxy
app.get('/imei/:imei', async (req, res) => {
    const { imei } = req.params;

          if (!/^\d{15}$/.test(imei)) {
                return res.status(400).json({ error: 'IMEI deve essere di 15 cifre' });
          }

          try {
                const fetch = (await import('node-fetch')).default;
                const response = await fetch(`https://imeicheck.com/api/validate/${imei}`, {
                        headers: {
                                  'User-Agent': 'Mozilla/5.0 (compatible; MagazzinoBot/1.0)',
                                  'Accept': 'application/json'
                        },
                        timeout: 5000
                });

      if (!response.ok) {
              throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
                res.json(data);
          } catch (error) {
                res.json({
                        valid: false,
                        info: { error: 'Servizio temporaneamente non disponibile' },
                        brand: 'Sconosciuto',
                        model: 'Sconosciuto'
                });
          }
});

// Global DB access
app.use((req, res, next) => {
    req.db = db;
    req.saveDB = saveDB;
    next();
});

// Routes
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/products', require('./routes/products'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/fornitori', require('./routes/fornitori'));
app.use('/api/servizi', require('./routes/servizi'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint non trovato' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, () => {
    console.log(`🚀 Magazzino API v2.2 → port ${PORT}`);
});  
