/**
 * seed-superadmin.js
 * Eseguire UNA SOLA VOLTA dopo il primo deploy:
 *   node db/seed-superadmin.js
 *
 * Variabili d'ambiente richieste:
 *   DATABASE_URL=postgresql://...
 *   SUPER_ADMIN_USERNAME=superadmin    (default: superadmin)
 *   SUPER_ADMIN_PASSWORD=...           (OBBLIGATORIO)
 *   SUPER_ADMIN_NAME=...               (default: Super Admin)
 */

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name     = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!password) {
    console.error('❌ SUPER_ADMIN_PASSWORD non impostata!');
    console.error('   Esporta la variabile prima di eseguire lo script:');
    console.error('   SUPER_ADMIN_PASSWORD=tua_password node db/seed-superadmin.js');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // Crea il tipo enum se non esiste (idempotente)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Crea la tabella users se non esiste
    await client.query(`
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
      )
    `);

    // Controlla se esiste già un SUPER_ADMIN
    const existing = await client.query(
      `SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`
    );
    if (existing.rows.length > 0) {
      console.log('⚠️  SUPER_ADMIN già esistente — seed saltato.');
      console.log(`   ID: ${existing.rows[0].id}`);
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await client.query(
      `INSERT INTO users (name, username, password_hash, role)
       VALUES ($1, $2, $3, 'SUPER_ADMIN')
       RETURNING id, name, username, role, created_at`,
      [name, username.toLowerCase(), hash]
    );

    console.log('✅ SUPER_ADMIN creato con successo!');
    console.log('   ID:       ', result.rows[0].id);
    console.log('   Username: ', result.rows[0].username);
    console.log('   Nome:     ', result.rows[0].name);
    console.log('   Creato:   ', result.rows[0].created_at);
    console.log('');
    console.log('🔐 Conserva queste credenziali in modo sicuro!');

  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('❌ Errore seed:', err.message);
  process.exit(1);
});
