import pkg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const { Client } = pkg
const __dirname = dirname(fileURLToPath(import.meta.url))

const PASSWORD = process.env.SUPABASE_DB_PASSWORD
if (!PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD non impostata')
  process.exit(1)
}

// Supabase pooler IP (bypass TIM DNS rebinding)
// Must pass SNI hostname for pooler routing
const POOLER_IP = '18.198.145.223'
const POOLER_HOST = 'aws-0-eu-central-1.pooler.supabase.com'
const client = new Client({
  host: POOLER_IP,
  port: 6543,
  database: 'postgres',
  user: `postgres.oeyqwcyxqkxctlcnmpxk`,
  password: PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    servername: POOLER_HOST,  // SNI for pooler routing
  },
})

async function main() {
  console.log('🔌 Connessione al database Supabase...')
  await client.connect()
  console.log('✅ Connesso!')

  // Read the migration file
  const sqlPath = resolve(__dirname, '..', 'supabase', 'migrations', '00001_initial_schema.sql')
  console.log(`📄 Lettura migration: ${sqlPath}`)
  const sql = readFileSync(sqlPath, 'utf-8')

  // Split by semicolons, filtering empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== '')

  console.log(`📝 Trovate ${statements.length} istruzioni SQL da eseguire`)

  let executed = 0
  let errors = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    // Skip pure comment blocks
    if (stmt.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) {
      continue
    }

    try {
      await client.query(stmt)
      executed++
    } catch (err) {
      // Ignore "already exists" errors for CREATE OR REPLACE functions
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        console.log(`  ⏭️  Statement ${i + 1}: già esistente, saltato`)
        continue
      }
      errors++
      console.error(`  ❌ Statement ${i + 1}: ${err.message?.slice(0, 120)}`)
    }
  }

  console.log(`\n✅ Eseguite ${executed} istruzioni con successo`)
  if (errors > 0) {
    console.log(`⚠️  ${errors} errori (potrebbero essere normali per oggetti già esistenti)`)
  }

  // Verify tables were created
  console.log('\n📋 Verifica tabelle create:')
  const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)
  for (const row of rows) {
    console.log(`  ✅ public.${row.table_name}`)
  }
  console.log(`\n🎉 Totale: ${rows.length} tabelle nel database`)

  await client.end()
}

main().catch(err => {
  console.error('❌ Errore fatale:', err.message)
  process.exit(1)
})
