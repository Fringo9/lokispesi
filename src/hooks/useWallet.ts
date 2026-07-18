import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { localDB } from '@/db/database'
import { syncManager } from '@/sync/SyncManager'
import type { ManualWallet } from '@/types'

const WALLET_KEY = 'wallet-accounts'

export function useWallet() {
  const queryClient = useQueryClient()

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
    queryKey: [WALLET_KEY, userId],
    queryFn: async (): Promise<ManualWallet[]> => {
      if (!userId) return []

      const local = await localDB.getWalletAccounts(userId)
      if (local.length > 0) return local

      if (navigator.onLine) {
        const { data } = await supabase
          .from('manual_wallets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })

        if (data) {
          await localDB.upsertWalletAccounts(data as ManualWallet[])
          return data as ManualWallet[]
        }
      }

      return []
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  const wallets = query.data ?? []
  const netWorth = wallets
    .filter((w) => w.is_included_in_net_worth)
    .reduce((sum, w) => sum + w.balance, 0)

  const createWallet = useMutation({
    mutationFn: async (wallet: Omit<ManualWallet, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const newWallet: ManualWallet = {
        id: crypto.randomUUID(),
        user_id: userId!,
        ...wallet,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('manual_wallets')
          .insert({ ...newWallet, id: undefined })
          .select()
          .single()
        if (!error && data) return data as ManualWallet
      }

      await syncManager.enqueueMutation('create', 'manual_wallets', newWallet as unknown as Record<string, unknown>)
      await localDB.walletAccounts.put(newWallet)
      return newWallet
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WALLET_KEY] }),
  })

  const updateWallet = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ManualWallet> }) => {
      const fullUpdates = { ...updates, updated_at: new Date().toISOString() }

      if (navigator.onLine) {
        const { error } = await supabase.from('manual_wallets').update(fullUpdates).eq('id', id)
        if (error) throw error
      } else {
        await syncManager.enqueueMutation('update', 'manual_wallets', fullUpdates as unknown as Record<string, unknown>, id)
      }

      await localDB.walletAccounts.update(id, fullUpdates)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WALLET_KEY] }),
  })

  const deleteWallet = useMutation({
    mutationFn: async (id: string) => {
      if (navigator.onLine) {
        const { error } = await supabase.from('manual_wallets').delete().eq('id', id)
        if (error) throw error
      } else {
        await syncManager.enqueueMutation('delete', 'manual_wallets', {}, id)
      }

      await localDB.walletAccounts.delete(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [WALLET_KEY] }),
  })

  return {
    wallets,
    netWorth,
    isLoading: query.isLoading,
    createWallet: createWallet.mutate,
    updateWallet: updateWallet.mutate,
    deleteWallet: deleteWallet.mutate,
  }
}
