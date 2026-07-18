// Edge Function: gocardless-callback
// Processes the GoCardless redirect after user authorizes bank access
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { GoCardlessClient } from '../_shared/gocardless.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GC_SECRET_ID = Deno.env.get('GOCARDLESS_SECRET_ID')!
const GC_SECRET_KEY = Deno.env.get('GOCARDLESS_SECRET_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const gc = new GoCardlessClient(GC_SECRET_ID, GC_SECRET_KEY)

    const url = new URL(req.url)
    const ref = url.searchParams.get('ref')

    if (!ref) {
      return new Response(
        JSON.stringify({ error: 'Missing ref parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the bank connection by requisition reference
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('reference_id', ref)
      .single()

    if (connError || !connection) {
      // If reference not found, try by requisition_id directly
      const { data: connById } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('requisition_id', ref)
        .single()

      if (!connById) {
        return new Response(
          JSON.stringify({ error: 'Connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return processConnection(supabase, gc, connById)
    }

    return processConnection(supabase, gc, connection)
  } catch (err) {
    console.error('gocardless-callback error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processConnection(
  supabase: any,
  gc: GoCardlessClient,
  connection: any
): Promise<Response> {
  // 1. Get requisition status from GoCardless
  const requisition = await gc.getRequisition(connection.requisition_id)

  if (requisition.status !== 'LN') {
    return new Response(
      JSON.stringify({ error: 'Requisition not linked yet', status: requisition.status }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 2. For each account in the requisition, fetch details
  const accounts = requisition.accounts || []
  const createdAccounts: string[] = []
  const errors: string[] = []

  for (const accountId of accounts) {
    try {
      // Fetch account details
      const details = await gc.getAccountDetails(accountId)
      const balances = await gc.getAccountBalances(accountId)

      // Get balance
      const balance = balances.balances?.find(
        (b: any) => b.balanceType === 'interimAvailable' || b.balanceType === 'expected'
      )

      // Save bank account
      const { error: insertError } = await supabase
        .from('bank_accounts')
        .upsert(
          {
            user_id: connection.user_id,
            connection_id: connection.id,
            institution_id: connection.institution_id,
            institution_name: details.account?.ownerName || connection.institution_name,
            account_id: accountId,
            account_name: details.account?.name || details.account?.product || 'Conto',
            account_iban: details.account?.iban || null,
            balance: balance ? parseFloat(balance.balanceAmount.amount) : null,
            requisition_id: connection.requisition_id,
            status: 'active',
          },
          { onConflict: 'user_id, account_id' }
        )

      if (insertError) {
        errors.push(`${accountId}: ${insertError.message}`)
      } else {
        createdAccounts.push(accountId)
      }

      // 3. Initial sync of transactions
      try {
        const txData = await gc.getAccountTransactions(accountId)
        const allTx = [...(txData.transactions.booked || []), ...(txData.transactions.pending || [])]

        for (const txn of allTx) {
          await supabase
            .from('bank_transactions')
            .upsert(
              {
                bank_account_id: accountId, // Will be updated after account fetch
                transaction_id: txn.transactionId || txn.entryReference || crypto.randomUUID(),
                amount: parseFloat(txn.transactionAmount.amount),
                description: txn.remittanceInformationUnstructured || txn.creditorName || txn.debtorName || '',
                currency: txn.transactionAmount.currency || 'EUR',
                booking_date: (txn.bookingDate || txn.valueDate || '').split('T')[0],
                value_date: txn.valueDate?.split('T')[0],
                bank_category: txn.proprietaryBankTransactionCode || null,
                metadata: txn,
              },
              { onConflict: 'bank_account_id, transaction_id' }
            )
        }
      } catch (syncErr) {
        errors.push(`sync ${accountId}: ${syncErr instanceof Error ? syncErr.message : 'Unknown'}`)
      }
    } catch (err) {
      errors.push(`${accountId}: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  // Update connection status
  await supabase
    .from('bank_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connection.id)

  // Also update the reference on the connection
  await supabase
    .from('bank_connections')
    .update({ reference_id: requisition.reference || connection.reference_id })
    .eq('id', connection.id)

  // Redirect user back to app
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: `${APP_URL}/app/accounts?connected=true&accounts=${createdAccounts.length}`,
    },
  })
}
