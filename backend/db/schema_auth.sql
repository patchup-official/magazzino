-- =============================================
-- MAGAZZINO v3.0 — Schema Auth + Multi-tenant
-- PostgreSQL — versione corretta
-- =============================================

-- Enum ruoli (idempotente)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── STORES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL UNIQUE,
  city        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── USERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role          user_role NOT NULL,
  name          TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active        BOOLEAN DEFAULT true,
  store_id      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Aggiungi FK solo se stores esiste già (safe)
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_store_fk
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_store    ON users(store_id);

-- ── SESSIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token       TEXT NOT NULL UNIQUE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ── AGGIUNTA store_id ALLE TABELLE ESISTENTI (safe) ──────────────────────
DO $$ BEGIN
  ALTER TABLE repairs ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table   THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE devices ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table   THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table   THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE servizi ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table   THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE clienti ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table   THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE purchases ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table   THEN NULL;
END $$;
