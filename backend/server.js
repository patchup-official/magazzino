// server.js — Magazzino v3.0 PostgreSQL + Auth
const express  = require('express')
const cors     = require('cors')
const { Pool } = require('pg')
const fs       = require('fs')
const path     = require('path')
const crypto   = require('crypto')

const app  = express()
const PORT = process.env.PORT || 3001

// DATABASE_URL — usa env var o fallback al DB di Frankfurt
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://valutazione_display_db_user:4CVFD4SyuKuoJsn7Y3aRr6nqgl2WbW0s@dpg-d71qj4f5gffc7381fn50-a/valutazione_display_db'

if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL non in env, uso connessione di fallback')
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS non consentito: ' + origin))
  },
  credentials: true,
}))
app.use(express.json())

const pgPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

app.locals.pgPool = pgPool

function convertPlaceholders(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

app.locals.query = async (sql, params = []) => {
  const { rows } = await pgPool.query(convertPlaceholders(sql), params)
  return rows
}
app.locals.run = async (sql, params = []) => {
  await pgPool.query(convertPlaceholders(sql), params)
}
app.locals.get = async (sql, params = []) => {
  const { rows } = await pgPool.query(convertPlaceholders(sql), params)
  return rows[0] || null
}
app.locals.uid = () => crypto.randomUUID()

async function initDB() {
  let attempts = 0
  while (attempts < 5) {
    try {
      const client = await pgPool.connect()
      console.log('✅ Connesso a PostgreSQL')
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS repairs (
            id TEXT PRIMARY KEY, cliente TEXT NOT NULL, tel TEXT, brand TEXT,
            modello TEXT NOT NULL, problema TEXT,
            priorita TEXT CHECK(priorita IN ('normale','alta','urgente')) DEFAULT 'normale',
            costo NUMERIC DEFAULT 0, data_stimata TEXT, progress INTEGER DEFAULT 0,
            stato TEXT CHECK(stato IN ('aperta','completata')) DEFAULT 'aperta',
            note TEXT, store_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS purchases (
            id TEXT PRIMARY KEY, brand TEXT NOT NULL, modello TEXT NOT NULL,
            storage TEXT, colore TEXT, imei TEXT, condizione TEXT, prezzo NUMERIC NOT NULL,
            tipo_pag TEXT CHECK(tipo_pag IN ('cash','voucher')) DEFAULT 'cash',
            cliente TEXT NOT NULL, tel TEXT, device_id TEXT, store_id TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY, nome TEXT NOT NULL, categoria TEXT NOT NULL,
            qty INTEGER DEFAULT 0, prezzo_acq NUMERIC DEFAULT 0, prezzo_vend NUMERIC DEFAULT 0,
            barcode TEXT UNIQUE, fornitore_id TEXT, note TEXT, store_id TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY, brand TEXT NOT NULL, modello TEXT NOT NULL,
            storage TEXT, colore TEXT, imei TEXT UNIQUE,
            condizione TEXT CHECK(condizione IN ('A','B','C')),
            stato TEXT CHECK(stato IN ('in_stock','venduto','in_riparazione','da_testare')) DEFAULT 'in_stock',
            provenienza TEXT CHECK(provenienza IN ('fornitore','privato')) DEFAULT 'fornitore',
            prezzo_acq NUMERIC DEFAULT 0, prezzo_vend NUMERIC DEFAULT 0,
            cliente_nome TEXT, cliente_tel TEXT, note TEXT, store_id TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS fornitori (
            id TEXT PRIMARY KEY, nome TEXT NOT NULL, contatto TEXT, email TEXT,
            telefono TEXT, piva TEXT, indirizzo TEXT, note TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS interventi (
            id TEXT PRIMARY KEY, device_id TEXT NOT NULL, tipo TEXT NOT NULL,
            descrizione TEXT, costo NUMERIC DEFAULT 0, fornitore_id TEXT,
            eseguito_da TEXT, data TEXT DEFAULT (now()::date::text),
            note TEXT, store_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS ricambi (
            id TEXT PRIMARY KEY, nome TEXT NOT NULL, categoria TEXT, compatibile TEXT,
            fornitore_id TEXT, qty INTEGER DEFAULT 0, qty_minima INTEGER DEFAULT 1,
            prezzo_acq NUMERIC DEFAULT 0, barcode TEXT UNIQUE, note TEXT, store_id TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS servizi (
            id TEXT PRIMARY KEY, cliente TEXT NOT NULL, telefono TEXT,
            dispositivo TEXT NOT NULL, tipo_servizio TEXT NOT NULL, nome_servizio TEXT NOT NULL,
            descrizione TEXT, priorita TEXT DEFAULT 'normale', prezzo NUMERIC NOT NULL,
            note TEXT, data_richiesta TEXT DEFAULT (now()::date::text),
            data_consegna_prevista TEXT, stato TEXT DEFAULT 'in_corso',
            store_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS clienti (
            id TEXT PRIMARY KEY, tipo TEXT NOT NULL DEFAULT 'persona_fisica',
            nome TEXT NOT NULL, cognome TEXT, ragione_soc TEXT, codice_fisc TEXT,
            piva TEXT, telefono TEXT, email TEXT, indirizzo TEXT, cap TEXT,
            citta TEXT, note TEXT, store_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS idx_repairs_stato     ON repairs(stato);
          CREATE INDEX IF NOT EXISTS idx_repairs_priorita  ON repairs(priorita);
          CREATE INDEX IF NOT EXISTS idx_devices_brand     ON devices(brand);
          CREATE INDEX IF NOT EXISTS idx_devices_stato     ON devices(stato);
          CREATE INDEX IF NOT EXISTS idx_clienti_nome      ON clienti(nome);
          CREATE INDEX IF NOT EXISTS idx_clienti_tel       ON clienti(telefono);
          CREATE INDEX IF NOT EXISTS idx_interventi_device ON interventi(device_id);
        `)
        const authSchema = path.join(__dirname, 'db', 'schema_auth.sql')
        if (fs.existsSync(authSchema)) {
          await client.query(fs.readFileSync(authSchema, 'utf-8'))
        }
        console.log('✅ Database inizializzato')
      } finally {
        client.release()
      }
      return
    } catch (err) {
      attempts++
      console.error(`⚠️  Tentativo ${attempts}/5 connessione DB fallito: ${err.message}`)
      if (attempts >= 5) throw err
      await new Promise(r => setTimeout(r, 3000))
    }
  }
}

async function startServer() {
  await initDB()
  const { verifyToken, injectStoreFilter } = require('./middleware/auth')
  app.use('/auth',  require('./routes/auth'))
  app.use('/admin', require('./routes/admin'))
  app.use('/store', require('./routes/store'))
  app.use('/products',     verifyToken, injectStoreFilter, require('./routes/products'))
  app.use('/devices',      verifyToken, injectStoreFilter, require('./routes/devices'))
  app.use('/repairs',      verifyToken, injectStoreFilter, require('./routes/repairs'))
  app.use('/purchases',    verifyToken, injectStoreFilter, require('./routes/purchases'))
  app.use('/servizi',      verifyToken, injectStoreFilter, require('./routes/servizi'))
  app.use('/clienti',      verifyToken, injectStoreFilter, require('./routes/clienti'))
  app.use('/fornitori',    verifyToken, require('./routes/fornitori'))
  app.use('/interventi',   verifyToken, require('./routes/interventi'))
  app.use('/ricambi',      verifyToken, require('./routes/ricambi'))
  app.use('/imei',         verifyToken, require('./routes/imei'))
  app.use('/valutazione',  verifyToken, require('./routes/valutazione'))
  app.use('/importexport', verifyToken, require('./routes/importexport'))
  const optRoutes = [
    ['/cassa','cassa_route'],['/display-ordini','display_ordini_route'],
    ['/foneday','foneday_route'],['/piani','piani'],
    ['/prenotazioni-ordini','prenotazioni_ordini_route'],['/promemoria','promemoria'],
    ['/protezioni','protezioni'],['/storico-dispositivi','storico_dispositivi_route'],
    ['/valutazione-display','valutazione_display_route'],
  ]
  for (const [mount, file] of optRoutes) {
    const p = path.join(__dirname, 'routes', file + '.js')
    if (fs.existsSync(p)) app.use(mount, verifyToken, require(p))
  }
  app.get('/health', async (req, res) => {
    try {
      const r = await pgPool.query(`SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM devices)  AS devices,
        (SELECT COUNT(*) FROM repairs)  AS repairs,
        (SELECT COUNT(*) FROM stores)   AS stores,
        (SELECT COUNT(*) FROM users)    AS users`)
      res.json({ status: 'ok', version: '3.0.0', db: 'postgresql', ...r.rows[0] })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  })
  app.use((err, req, res, next) => {
    console.error(err.message)
    res.status(err.status || 500).json({ error: err.message })
  })
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`🚀 Magazzino API v3.0 → port ${PORT} | DB: PostgreSQL`)
  )
}

startServer().catch(err => {
  console.error('❌ Errore avvio server:', err.message)
  process.exit(1)
})
