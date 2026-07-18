import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ReconciliationMatch {
  bank_tx_id: string
  manual_tx_id: string | null
  confidence: 'high' | 'medium' | 'none'
  reason: string
}

export interface ReconciliationResult {
  matches: ReconciliationMatch[]
  total: number
  reconciled: number
  suggested: number
  unmatched: number
}

const FUNCTIONS_BASE =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
  `${import.meta.env.VITE_SUPABASE_URL?.replace('.co', '.co/functions/v1')}`

export function useReconciliation(bankAccountId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['reconciliation', bankAccountId],
    queryFn: async (): Promise<ReconciliationResult> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(`${FUNCTIONS_BASE}/reconcile-transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bankAccountId ? { bank_account_id: bankAccountId } : {}),
      })

      if (!res.ok) throw new Error('Reconciliation failed')
      return res.json()
    },
    enabled: !!bankAccountId || bankAccountId === undefined,
    staleTime: 1000 * 60 * 5,
  })

  const acceptMatch = useMutation({
    mutationFn: async ({
      manualTxId,
      bankTxId,
    }: {
      manualTxId: string
      bankTxId: string
    }) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          is_reconciled: true,
          linked_bank_tx: bankTxId,
        })
        .eq('id', manualTxId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  return {
    result: query.data,
    isLoading: query.isLoading,
    acceptMatch: acceptMatch.mutate,
    refetch: query.refetch,
  }
}
