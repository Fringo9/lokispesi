import { supabase } from './supabase'

// Edge Function URLs — use Supabase functions URL or local dev
const FUNCTIONS_BASE =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
  `${import.meta.env.VITE_SUPABASE_URL?.replace('.co', '.co/functions/v1')}`

export interface ConnectBankResult {
  link: string
  requisition_id: string
  agreement_id: string
  reference: string
}

export interface SyncResult {
  success: boolean
  accounts_processed: number
  total_transactions: number
  new_transactions: number
  errors?: string[]
}

/**
 * Connect a bank account via GoCardless
 */
export async function connectBank(
  institutionId: string
): Promise<ConnectBankResult> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(`${FUNCTIONS_BASE}/gocardless-connect`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ institution_id: institutionId }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to connect bank')
  }

  return res.json()
}

/**
 * Sync transactions from a connected bank account
 */
export async function syncBankAccount(bankAccountId?: string): Promise<SyncResult> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(`${FUNCTIONS_BASE}/gocardless-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bankAccountId ? { bank_account_id: bankAccountId } : {}),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to sync bank account')
  }

  return res.json()
}

/**
 * Handle GoCardless callback after user authorizes bank access
 */
export function handleBankCallback(ref: string): void {
  // Store reference and redirect to accounts page
  localStorage.setItem('gocardless_callback_ref', ref)
  window.location.href = '/app/accounts'
}

/**
 * List available banks in Italy
 */
export async function listItalianBanks(): Promise<
  Array<{ id: string; name: string; logo: string; bic: string }>
> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  // The institutions list doesn't need GoCardless auth — use a simple fetch
  // In production, this should be proxied through an Edge Function
  const res = await fetch(
    'https://bankaccountdata.gocardless.com/api/v2/institutions/?country=IT',
    {
      headers: { accept: 'application/json' },
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch bank list')
  }

  return res.json()
}
