require('dotenv').config({ path: '../.env' })
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://valutazione_display_db_user:4CVFD4SyuKuoJsn7Y3aRr6nqgl2WbW0s@dpg-d71qj4f5gffc7381fn50-a/valutazione_display_db'

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function seed() {
  const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin'
  const password = process.env.SUPER_ADMIN_PASSWORD || 'PatchUP2026!'
  const name     = process.env.SUPER_ADMIN_NAME || 'Super Admin'

  const client = await pool.connect()
  try {
    const existing = await client.query(`SELECT id FROM mg_users WHERE role='SUPER_ADMIN' LIMIT 1`)
    if (existing.rows.length > 0) {
      console.log('⚠️  SUPER_ADMIN già esistente — ID:', existing.rows[0].id)
      return
    }
    const hash = await bcrypt.hash(password, 12)
    const result = await client.query(
      `INSERT INTO mg_users (name, username, password_hash, role) VALUES ($1,$2,$3,'SUPER_ADMIN') RETURNING id,name,username`,
      [name, username.toLowerCase(), hash]
    )
    console.log('✅ SUPER_ADMIN creato!')
    console.log('   Username:', result.rows[0].username)
    console.log('   Password:', password)
    console.log('   ID:', result.rows[0].id)
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(err => { console.error('❌ Errore:', err.message); process.exit(1) })
