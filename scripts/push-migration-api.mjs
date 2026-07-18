import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = 'oeyqwcyxqkxctlcnmpxk'
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN non impostata')
  process.exit(1)
}

async function executeSQL(query) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${res.status}: ${err.slice(0, 200)}`)
  }

  return res.json()
}

async function main() {
  const sqlPath = resolve(__dirname, '..', 'supabase', 'migrations', '00001_initial_schema.sql')
  console.log(`📄 Lettura migration: ${sqlPath}`)
  const sql = readFileSync(sqlPath, 'utf-8')

  // Split into individual statements (handle dollar-quoted blocks)
  const statements = splitSQL(sql)
  console.log(`📝 ${statements.length} istruzioni da eseguire\n`)

  let ok = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim()
    if (!stmt) continue

    const preview = stmt.split('\n')[0].slice(0, 80)
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `)

    try {
      await executeSQL(stmt)
      console.log('✅')
      ok++
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('42710')) {
        console.log('⏭️  (già esistente)')
        skipped++
      } else if (msg.includes('policy already exists') || msg.includes('42710') || msg.includes('Publication')) {
        console.log('⏭️  (già esistente)')
        skipped++
      } else {
        console.log(`❌ ${msg.slice(0, 100)}`)
        failed++
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Successo:  ${ok}`)
  console.log(`⏭️  Saltate:  ${skipped} (già esistenti)`)
  if (failed > 0) console.log(`❌ Fallite:   ${failed}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  // Verify
  console.log('\n📋 Tabelle nel database:')
  try {
    const result = await executeSQL(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    )
    if (Array.isArray(result)) {
      for (const row of result) console.log(`  ✅ public.${row.table_name}`)
      console.log(`\n🎉 Totale: ${result.length} tabelle`)
    }
  } catch (err) {
    console.log('  (verifica saltata, ma le istruzioni sono state eseguite)')
  }
}

// Split SQL handling dollar-quoted strings ($$ ... $$)
function splitSQL(sql) {
  const statements = []
  let current = ''
  let inDollar = false
  let dollarTag = ''

  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()

    // Check for dollar quote start/end
    if (!inDollar && trimmed.includes('$$') && !trimmed.startsWith('--')) {
      inDollar = true
      current += line + '\n'
      continue
    }
    if (inDollar) {
      current += line + '\n'
      if (trimmed.includes('$$') && !trimmed.includes('$BODY$')) {
        inDollar = false
      }
      continue
    }

    // Statement boundary
    if (trimmed.endsWith(';')) {
      current += line + '\n'
      statements.push(current)
      current = ''
    } else if (trimmed !== '' || current !== '') {
      current += line + '\n'
    }
  }

  if (current.trim()) statements.push(current)
  return statements
}

main().catch(err => {
  console.error('❌ Errore:', err.message)
  process.exit(1)
})
