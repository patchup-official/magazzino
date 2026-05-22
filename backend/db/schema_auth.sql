-- schema_auth.sql v4 — tabelle con prefisso mg_ per evitare conflitti

DO $$ BEGIN
  CREATE TYPE mg_user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mg_stores (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL UNIQUE,
  city       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mg_users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role          mg_user_role NOT NULL,
  name          TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active        BOOLEAN DEFAULT true,
  store_id      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mg_users_username ON mg_users(username);
CREATE INDEX IF NOT EXISTS idx_mg_users_store    ON mg_users(store_id);

CREATE TABLE IF NOT EXISTS mg_sessions (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token      TEXT NOT NULL UNIQUE,
  user_id    TEXT NOT NULL REFERENCES mg_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mg_sessions_token   ON mg_sessions(token);
CREATE INDEX IF NOT EXISTS idx_mg_sessions_user    ON mg_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mg_sessions_expires ON mg_sessions(expires_at);

-- Aggiunge store_id alle tabelle esistenti (TEXT senza FK)
DO $$ BEGIN ALTER TABLE repairs  ADD COLUMN store_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE devices  ADD COLUMN store_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE products ADD COLUMN store_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE servizi  ADD COLUMN store_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE clienti  ADD COLUMN store_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE purchases ADD COLUMN store_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL; END $$;
