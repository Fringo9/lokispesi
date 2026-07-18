// Edge Function: wallet-snapshot
// Daily cron: captures net worth snapshot for historical tracking
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const today = new Date().toISOString().split('T')[0]

    // Get all unique user IDs with wallets or bank accounts
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')

    if (profileError) throw profileError
    if (!profiles) return new Response(JSON.stringify({ snapshots: 0 }))

    let created = 0

    for (const profile of profiles) {
      const userId = profile.id

      // Sum manual wallets
      const { data: wallets } = await supabase
        .from('manual_wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('is_included_in_net_worth', true)

      const manualBalance = wallets?.reduce((sum, w) => sum + w.balance, 0) ?? 0

      // Sum bank account balances
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('user_id', userId)
        .eq('status', 'active')

      const bankBalance = bankAccounts?.reduce((sum, a) => sum + (a.balance ?? 0), 0) ?? 0

      const totalBalance = manualBalance + bankBalance

      // Upsert snapshot for today (avoid duplicates)
      const { error: upsertError } = await supabase
        .from('wallet_snapshots')
        .upsert(
          {
            user_id: userId,
            snapshot_date: today,
            total_balance: totalBalance,
            bank_balance: bankBalance,
            manual_balance: manualBalance,
          },
          { onConflict: 'user_id, snapshot_date' }
        )

      if (!upsertError) created++
    }

    return new Response(
      JSON.stringify({ snapshots: created, date: today })
    )
  } catch (err) {
    console.error('wallet-snapshot error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 }
    )
  }
})
