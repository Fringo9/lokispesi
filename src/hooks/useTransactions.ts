import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { localDB } from '@/db/database'
import { syncManager } from '@/sync/SyncManager'
import type { Transaction, ExpenseFormData } from '@/types'

const TRANSACTIONS_KEY = 'transactions'

export function useTransactions(year: number, month: number) {
  const queryClient = useQueryClient()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.user ?? null
    },
    staleTime: Infinity,
  })

  const userId = user?.id

  const query = useQuery({
    queryKey: [TRANSACTIONS_KEY, userId, year, month],
    queryFn: async (): Promise<Transaction[]> => {
      if (!userId) return []

      // Try local first
      const local = await localDB.getTransactionsByDateRange(userId, start, end)

      // If online, try server
      if (navigator.onLine) {
        const { data: remote, error } = await supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .eq('user_id', userId)
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: false })

        if (!error && remote) {
          const merged = mergeTransactions(local, remote as Transaction[])
          await localDB.upsertTransactions(merged)
          return merged.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
        }
      }

      return local
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  })

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const newTx: Partial<Transaction> = {
        id: crypto.randomUUID(),
        user_id: userId!,
        type: data.type,
        amount: data.amount,
        category_id: data.category_id,
        transaction_date: data.transaction_date,
        description: data.description || data.note,
        note: data.note,
        family_id: data.family_id,
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistic: write to local DB
      await localDB.transactions.put(newTx as Transaction)

      if (navigator.onLine && userId) {
        const { data: serverData, error } = await supabase
          .from('transactions')
          .insert({ ...newTx, id: undefined }) // Let server generate ID
          .select('*, category:categories(*)')
          .single()

        if (error) {
          await syncManager.enqueueMutation('create', 'transactions', newTx as Record<string, unknown>)
        } else if (serverData) {
          // Update local with server data
          await localDB.transactions.delete(newTx.id!)
          await localDB.transactions.put(serverData as Transaction)
        }
      } else {
        await syncManager.enqueueMutation('create', 'transactions', newTx as Record<string, unknown>)
      }

      return newTx as Transaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExpenseFormData> }) => {
      const updates = { ...data, updated_at: new Date().toISOString() }

      if (navigator.onLine && userId) {
        const { error } = await supabase.from('transactions').update(updates).eq('id', id)
        if (error) {
          await syncManager.enqueueMutation('update', 'transactions', updates, id)
        }
      } else {
        await syncManager.enqueueMutation('update', 'transactions', updates, id)
      }

      // Update local
      await localDB.transactions.update(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (navigator.onLine && userId) {
        const { error } = await supabase.from('transactions').delete().eq('id', id)
        if (error) {
          await syncManager.enqueueMutation('delete', 'transactions', {}, id)
        }
      } else {
        await syncManager.enqueueMutation('delete', 'transactions', {}, id)
      }

      await localDB.transactions.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] })
    },
  })

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
  }
}

function mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>()
  for (const tx of local) map.set(tx.id, tx)
  for (const tx of remote) {
    const localTx = map.get(tx.id)
    if (!localTx || new Date(tx.updated_at) > new Date(localTx.updated_at)) {
      map.set(tx.id, tx)
    }
  }
  return [...map.values()]
}
