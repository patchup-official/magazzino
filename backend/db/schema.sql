-- =============================================
-- MAGAZZINO v2.0 — Schema Database SQLite
-- =============================================

CREATE TABLE IF NOT EXISTS repairs (
  id           TEXT PRIMARY KEY,
  cliente      TEXT NOT NULL,
  tel          TEXT,
  brand        TEXT,
  modello      TEXT NOT NULL,
  problema     TEXT,
  priorita     TEXT CHECK(priorita IN ('normale','alta','urgente')) DEFAULT 'normale',
  costo        REAL DEFAULT 0,
  data_stimata TEXT,
  progress     INTEGER DEFAULT 0,
  stato        TEXT CHECK(stato IN ('aperta','completata')) DEFAULT 'aperta',
  note         TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id         TEXT PRIMARY KEY,
  brand      TEXT NOT NULL,
  modello    TEXT NOT NULL,
  storage    TEXT,
  colore     TEXT,
  imei       TEXT,
  condizione TEXT,
  prezzo     REAL NOT NULL,
  tipo_pag   TEXT CHECK(tipo_pag IN ('cash','voucher')) DEFAULT 'cash',
  cliente    TEXT NOT NULL,
  tel        TEXT,
  device_id  TEXT REFERENCES devices(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_repairs_stato      ON repairs(stato);
CREATE INDEX IF NOT EXISTS idx_repairs_priorita   ON repairs(priorita);
CREATE INDEX IF NOT EXISTS idx_purchases_date     ON purchases(created_at);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  qty         INTEGER DEFAULT 0,
  prezzo_acq  REAL DEFAULT 0,
  prezzo_vend REAL DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devices (
  id           TEXT PRIMARY KEY,
  brand        TEXT NOT NULL,
  modello      TEXT NOT NULL,
  storage      TEXT,
  colore       TEXT,
  imei         TEXT UNIQUE,
  condizione   TEXT CHECK(condizione IN ('A','B','C')),
  stato        TEXT CHECK(stato IN ('in_stock','venduto','in_riparazione','da_testare')) DEFAULT 'in_stock',
  provenienza  TEXT CHECK(provenienza IN ('fornitore','privato')) DEFAULT 'fornitore',
  prezzo_acq   REAL DEFAULT 0,
  prezzo_vend  REAL DEFAULT 0,
  cliente_nome TEXT,
  cliente_tel  TEXT,
  note         TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- INDEX per query frequenti
CREATE INDEX IF NOT EXISTS idx_devices_brand ON devices(brand);
CREATE INDEX IF NOT EXISTS idx_devices_stato ON devices(stato);
CREATE INDEX IF NOT EXISTS idx_devices_provenienza ON devices(provenienza);

-- ── FORNITORI ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fornitori (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  contatto    TEXT,
  email       TEXT,
  telefono    TEXT,
  piva        TEXT,
  indirizzo   TEXT,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ── PRODOTTI (aggiornata con barcode e fornitore) ─────────────────────────
-- La tabella products esistente viene estesa con ALTER TABLE
-- (aggiungiamo le colonne mancanti se non esistono)

-- ── INTERVENTI DISPOSITIVO ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interventi (
  id           TEXT PRIMARY KEY,
  device_id    TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL,  -- sostituzione_batteria, sostituzione_schermo, ecc.
  descrizione  TEXT,
  costo        REAL DEFAULT 0,
  fornitore_id TEXT REFERENCES fornitori(id),
  eseguito_da  TEXT,          -- interno / fornitore esterno
  data         TEXT DEFAULT (datetime('now')),
  note         TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- ── RICAMBI (uso interno, non vendita) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ricambi (
  id           TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  categoria    TEXT,          -- batteria, schermo, scocca, ecc.
  compatibile  TEXT,          -- es. "iPhone 13, iPhone 14"
  fornitore_id TEXT REFERENCES fornitori(id),
  qty          INTEGER DEFAULT 0,
  qty_minima   INTEGER DEFAULT 1,  -- alert se sotto questa soglia
  prezzo_acq   REAL DEFAULT 0,
  barcode      TEXT UNIQUE,
  note         TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_interventi_device ON interventi(device_id);
CREATE INDEX IF NOT EXISTS idx_ricambi_categoria ON ricambi(categoria);
