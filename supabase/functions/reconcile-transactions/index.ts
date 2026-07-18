// Edge Function: reconcile-transactions
// Matches imported bank transactions with manually entered transactions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface BankTransaction {
  id: string
  bank_account_id: string
  transaction_id: string
  amount: number
  description: string
  booking_date: string
  value_date?: string
}

interface ManualTransaction {
  id: string
  amount: number
  transaction_date: string
  description?: string
  note?: string
}

interface MatchResult {
  bank_tx_id: string
  manual_tx_id: string | null
  confidence: 'high' | 'medium' | 'none'
  reason: string
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse optional bank_account_id filter
    const body = await req.json().catch(() => ({}))
    const { bank_account_id } = body

    // Fetch unreconciled bank transactions
    let bankQuery = supabase
      .from('bank_transactions')
      .select('*, bank_accounts!inner(id, user_id)')
      .eq('bank_accounts.user_id', user.id)
      .order('booking_date', { ascending: false })
      .limit(100)

    if (bank_account_id) {
      bankQuery = bankQuery.eq('bank_account_id', bank_account_id)
    }

    const { data: bankTxs } = await bankQuery

    if (!bankTxs || bankTxs.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: 'No bank transactions to reconcile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch user's manual transactions (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const dateFrom = ninetyDaysAgo.toISOString().split('T')[0]

    const { data: manualTxs } = await supabase
      .from('transactions')
      .select('id, amount, transaction_date, description, note')
      .eq('user_id', user.id)
      .is('linked_bank_tx', null)
      .gte('transaction_date', dateFrom)

    const results: MatchResult[] = []

    for (const btx of bankTxs as any[]) {
      let bestMatch: { id: string; confidence: number; reason: string } | null = null

      if (manualTxs) {
        for (const mtx of manualTxs as ManualTransaction[]) {
          // Rule 1: Exact amount match within 3 days → high confidence
          const amountMatch = Math.abs(btx.amount - mtx.amount) < 0.01
          const dateDiff = Math.abs(
            new Date(btx.booking_date).getTime() - new Date(mtx.transaction_date).getTime()
          )
          const daysDiff = dateDiff / (1000 * 60 * 60 * 24)

          if (amountMatch && daysDiff <= 3) {
            bestMatch = { id: mtx.id, confidence: 90, reason: 'Exact amount, same date (±3d)' }
            break
          }

          // Rule 2: Amount match within 1% within 7 days + description similarity
          const amountSimilar = Math.abs(btx.amount - mtx.amount) / btx.amount < 0.01
          if (amountSimilar && daysDiff <= 7) {
            const descSimilarity = levenshteinSimilarity(
              (btx.description || '').toLowerCase(),
              ((mtx.description || '') + (mtx.note || '')).toLowerCase()
            )
            if (descSimilarity > 0.6 && (!bestMatch || descSimilarity > bestMatch.confidence / 100)) {
              bestMatch = {
                id: mtx.id,
                confidence: Math.round(descSimilarity * 100),
                reason: `Similar amount + description (${Math.round(descSimilarity * 100)}%)`,
              }
            }
          }
        }
      }

      if (bestMatch) {
        const confidence: 'high' | 'medium' = bestMatch.confidence >= 80 ? 'high' : 'medium'

        // Auto-reconcile high confidence matches
        if (confidence === 'high') {
          await supabase
            .from('transactions')
            .update({
              is_reconciled: true,
              linked_bank_tx: btx.id,
            })
            .eq('id', bestMatch.id)
        }

        results.push({
          bank_tx_id: btx.id,
          manual_tx_id: bestMatch.id,
          confidence,
          reason: bestMatch.reason,
        })
      } else {
        results.push({
          bank_tx_id: btx.id,
          manual_tx_id: null,
          confidence: 'none',
          reason: 'No matching transaction found',
        })
      }
    }

    return new Response(
      JSON.stringify({
        matches: results,
        total: results.length,
        reconciled: results.filter(r => r.confidence === 'high').length,
        suggested: results.filter(r => r.confidence === 'medium').length,
        unmatched: results.filter(r => r.confidence === 'none').length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('reconcile-transactions error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Simple Levenshtein similarity ratio
 * Returns value between 0 (completely different) and 1 (identical)
 */
function levenshteinSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1

  const lenA = a.length
  const lenB = b.length
  const maxLen = Math.max(lenA, lenB)

  // Matrix
  const d: number[][] = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0))

  for (let i = 0; i <= lenA; i++) d[i][0] = i
  for (let j = 0; j <= lenB; j++) d[0][j] = j

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      )
    }
  }

  return 1 - d[lenA][lenB] / maxLen
}
