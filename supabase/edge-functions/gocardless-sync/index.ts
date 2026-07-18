// Edge Function: gocardless-sync
// Syncs transactions from a connected bank account
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { GoCardlessClient } from '../_shared/gocardless.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GC_SECRET_ID = Deno.env.get('GOCARDLESS_SECRET_ID')!
const GC_SECRET_KEY = Deno.env.get('GOCARDLESS_SECRET_KEY')!

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const gc = new GoCardlessClient(GC_SECRET_ID, GC_SECRET_KEY)

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

    // Parse request — can be called with bank_account_id or sync all user accounts
    const body = await req.json().catch(() => ({}))
    const { bank_account_id } = body

    // Query bank accounts
    let accountsQuery = supabase
      .from('bank_accounts')
      .select('*, bank_connections!inner(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (bank_account_id) {
      accountsQuery = accountsQuery.eq('id', bank_account_id)
    }

    const { data: accounts, error: fetchError } = await accountsQuery

    if (fetchError || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active bank accounts found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalSynced = 0
    let totalNew = 0
    const errors: string[] = []

    for (const account of accounts) {
      try {
        // Fetch transactions from GoCardless
        const txnData = await gc.getAccountTransactions(account.account_id)

        // Fetch latest balance
        const balanceData = await gc.getAccountBalances(account.account_id)
        const balances = balanceData.balances || []
        const currentBalance = balances.find(
          b => b.balanceType === 'interimAvailable' || b.balanceType === 'expected'
        )
        if (currentBalance) {
          await supabase
            .from('bank_accounts')
            .update({ balance: parseFloat(currentBalance.balanceAmount.amount) })
            .eq('id', account.id)
        }

        // Process booked transactions
        const allTransactions = [
          ...(txnData.transactions.booked || []),
          ...(txnData.transactions.pending || []),
        ]

        for (const txn of allTransactions) {
          const amount = parseFloat(txn.transactionAmount.amount)
          const currency = txn.transactionAmount.currency || 'EUR'
          const description = txn.remittanceInformationUnstructured
            || txn.creditorName
            || txn.debtorName
            || 'Transazione bancaria'

          // Insert bank transaction (dedup via transaction_id)
          const { error: insertError } = await supabase
            .from('bank_transactions')
            .upsert(
              {
                bank_account_id: account.id,
                transaction_id: txn.transactionId || txn.entryReference || crypto.randomUUID(),
                amount: Math.abs(amount),
                description,
                currency,
                booking_date: txn.bookingDate?.split('T')[0] || txn.valueDate?.split('T')[0],
                value_date: txn.valueDate?.split('T')[0],
                bank_category: txn.proprietaryBankTransactionCode || null,
                metadata: txn,
              },
              { onConflict: 'bank_account_id, transaction_id' }
            )

          if (!insertError) totalNew++
          totalSynced++
        }
      } catch (err) {
        errors.push(`${account.account_name || account.account_id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Update last_synced_at
    await supabase
      .from('bank_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'active')

    return new Response(
      JSON.stringify({
        success: true,
        accounts_processed: accounts.length,
        total_transactions: totalSynced,
        new_transactions: totalNew,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('gocardless-sync error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
