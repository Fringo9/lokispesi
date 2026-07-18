// Execute SQL migration via Supabase JS client with service_role key
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://oeyqwcyxqkxctlcnmpxk.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9leXF3Y3l4cWt4Y3RsY25tcHhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM4MDAwNiwiZXhwIjoyMDk5OTU2MDA2fQ.BWtOCdGEV1S4122MYQHDrzaryg8ahECZL0bhqUBVm5w'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function splitSQL(sql) {
  const statements = []
  let current = ''
  let inDollar = false
  let dollarCount = 0

  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()

    // Detect $$ or $BODY$ start
    if (!inDollar && (trimmed.includes('$$') || trimmed.includes('$BODY$') || trimmed.includes("'")) && !trimmed.startsWith('--')) {
      // Only enter dollar mode for function bodies, not for string literals
      if (trimmed.includes('$$') && !trimmed.includes("'")) {
        inDollar = true
      }
    }

    current += line + '\n'

    // Detect $$ close
    if (inDollar) {
      if (trimmed.includes('$$') && (trimmed.endsWith('$$;') || trimmed.endsWith('$$ LANGUAGE') || trimmed === '$$;')) {
        inDollar = false
        statements.push(current.trim())
        current = ''
        continue
      }
      continue
    }

    // Normal statement end
    if (trimmed.endsWith(';')) {
      const stmt = current.trim()
      if (stmt && stmt !== ';') {
        // Filter out pure comment blocks
        const nonCommentLines = stmt.split('\n').filter(l => {
          const t = l.trim()
          return t !== '' && !t.startsWith('--') && !t.startsWith('/*')
        })
        if (nonCommentLines.length > 0) {
          statements.push(stmt)
        }
      }
      current = ''
    }
  }

  if (current.trim()) statements.push(current.trim())
  return statements
}

async function runSQLStatement(stmt) {
  // Use the Supabase REST API to execute raw SQL
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sql',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'tx=commit',
    },
    body: stmt,
  })

  if (res.ok) return { ok: true }
  const err = await res.text()
  return { ok: false, error: err }
}

async function main() {
  const sqlPath = resolve(__dirname, '..', 'supabase', 'migrations', '00001_initial_schema.sql')
  console.log(`📄 Migration: ${sqlPath}`)
  const sql = readFileSync(sqlPath, 'utf-8')

  const statements = splitSQL(sql)
  console.log(`📝 ${statements.length} istruzioni SQL trovate\n`)

  // For DDL statements, use the Supabase SQL API
  // Try different methods
  let ok = 0, fail = 0, skip = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const firstLine = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--') && !l.trim().startsWith('/*'))?.trim().slice(0, 75) || '(empty)'

    process.stdout.write(`[${String(i + 1).padStart(2, ' ')}/${statements.length}] ${firstLine}... `)

    try {
      // Method 1: Try the SQL endpoint directly
      let result = await runSQLStatement(stmt)

      // Method 2: If method 1 fails with 404, try the management API
      if (!result.ok && result.error?.includes('404')) {
        const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/oeyqwcyxqkxctlcnmpxk/database/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: stmt }),
        })
        result = { ok: mgmtRes.ok, error: mgmtRes.ok ? null : await mgmtRes.text() }
      }

      if (result.ok) {
        console.log('✅')
        ok++
      } else {
        const errMsg = result.error || ''
        if (errMsg.includes('already exists') || errMsg.includes('42710') || errMsg.includes('duplicate') || errMsg.includes('42701')) {
          console.log('⏭️ (già esistente)')
          skip++
        } else {
          console.log(`❌ ${errMsg.slice(0, 80)}`)
          fail++
        }
      }
    } catch (err) {
      console.log(`❌ ${err.message?.slice(0, 80)}`)
      fail++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Successo:  ${ok}`)
  console.log(`⏭️  Saltate:   ${skip}`)
  if (fail > 0) console.log(`❌ Fallite:   ${fail}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  // Verify tables
  console.log('\n📋 Verifica tabelle esistenti...')
  const tables = [
    'profiles', 'categories', 'transactions', 'bank_accounts', 'bank_connections',
    'bank_transactions', 'manual_wallets', 'wallet_snapshots', 'scheduled_transactions',
    'family_groups', 'family_members', 'sync_queue', 'sync_log'
  ]

  let found = 0
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
    if (!error) {
      console.log(`  ✅ public.${table}`)
      found++
    } else {
      console.log(`  ❌ public.${table} — ${error.message.slice(0, 60)}`)
    }
  }

  console.log(`\n🎉 ${found}/${tables.length} tabelle presenti nel database`)
}

main().catch(err => console.error('❌ Errore fatale:', err.message))
