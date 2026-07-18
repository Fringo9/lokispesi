import { localDB } from '@/db/database'
import { supabase } from '@/lib/supabase'
import type { SyncQueueItem, Transaction, Category, ManualWallet } from '@/types'

export interface SyncResult {
  status: 'success' | 'already_syncing' | 'offline' | 'error'
  pushed?: number
  pulled?: number
  error?: string
}

/**
 * Calculate delay with exponential backoff and jitter
 * delay = min(cap, base * 2^attempt) + random jitter
 */
function getBackoffDelay(attempt: number, baseMs = 1000, capMs = 60000): number {
  const exponential = Math.min(capMs, baseMs * Math.pow(2, attempt))
  const jitter = Math.random() * 1000
  return exponential + jitter
}

class SyncManager {
  private isSyncing = false
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyListeners(true)
        this.sync()
      })
      window.addEventListener('offline', () => this.notifyListeners(false))

      // Listen for messages from Service Worker (background sync triggers)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'TRIGGER_SYNC') {
            console.log('[SyncManager] Background sync triggered by SW')
            this.sync()
          }
        })
      }
    }
  }

  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  onConnectivityChange(cb: (online: boolean) => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach((cb) => cb(online))
  }

  async start(): Promise<void> {
    // Register Periodic Background Sync (Android/Chrome)
    if ('serviceWorker' in navigator && 'PeriodicSyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName,
        })
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register('sync-data', {
            minInterval: 15 * 60 * 1000,
          })
        }
      } catch {
        // Periodic sync not available (iOS) — fallback to online event
      }
    }

    // Initial sync if online
    if (this.isOnline) {
      await this.sync()
    }
  }

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) return { status: 'already_syncing' }
    if (!this.isOnline) return { status: 'offline' }

    this.isSyncing = true

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { status: 'error', error: 'Not authenticated' }

      const userId = session.user.id
      let pushed = 0
      let pulled = 0

      // Phase 1: Push local changes to server
      const pending = await localDB.getPendingSync()

      for (const item of pending) {
        const currentRetry = item.retryCount ?? 0

        // Calculate backoff delay
        if (currentRetry > 0) {
          const delay = getBackoffDelay(currentRetry, 2000, 120000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        try {
          await this.pushItem(item, userId)
          await localDB.updateSyncStatus(item.localId!, 'synced')
          pushed++
        } catch {
          const newRetry = currentRetry + 1
          if (newRetry >= 5) {
            await localDB.updateSyncStatus(item.localId!, 'failed', newRetry)
          } else {
            await localDB.updateSyncStatus(item.localId!, 'pending', newRetry)
          }
        }
      }

      // Clean synced items
      await localDB.clearSyncedItems()

      // Phase 2: Pull remote changes
      const [txResult, catResult, walletResult] = await Promise.all([
        supabase.from('transactions').select('*, category:categories(*)').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(500),
        supabase.from('categories').select('*').eq('user_id', userId),
        supabase.from('manual_wallets').select('*').eq('user_id', userId),
      ])

      if (txResult.data) {
        await localDB.upsertTransactions(txResult.data as Transaction[])
        pulled += txResult.data.length
      }
      if (catResult.data) {
        await localDB.upsertCategories(catResult.data as Category[])
      }
      if (walletResult.data) {
        await localDB.upsertWalletAccounts(walletResult.data as ManualWallet[])
      }

      return { status: 'success', pushed, pulled }
    } catch (err) {
      console.error('Sync error:', err)
      return { status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }
    } finally {
      this.isSyncing = false
    }
  }

  async enqueueMutation(
    action: SyncQueueItem['action'],
    entity: string,
    payload: Record<string, unknown>,
    entityId?: string
  ): Promise<void> {
    await localDB.enqueueSync({
      entity_type: entity,
      entity_id: entityId,
      action,
      payload,
      status: 'pending',
      retryCount: 0,
      created_at: new Date().toISOString(),
    })
  }

  private async pushItem(item: SyncQueueItem, userId: string): Promise<void> {
    let query

    switch (item.action) {
      case 'create':
        query = supabase.from(item.entity_type).insert({ ...item.payload, user_id: userId })
        break
      case 'update':
        query = supabase
          .from(item.entity_type)
          .update(item.payload)
          .eq('id', item.entity_id!)
          .eq('user_id', userId)
        break
      case 'delete':
        query = supabase
          .from(item.entity_type)
          .delete()
          .eq('id', item.entity_id!)
          .eq('user_id', userId)
        break
    }

    if (query) {
      const { error } = await query
      if (error) throw error
    }
  }

  async enqueueTransaction(
    action: 'create' | 'update' | 'delete',
    payload: Record<string, unknown>,
    entityId?: string
  ): Promise<void> {
    // Also write to local DB immediately for instant UX
    if (action === 'create' || action === 'update') {
      await localDB.transactions.put(payload as unknown as Transaction)
    } else if (action === 'delete' && entityId) {
      await localDB.transactions.delete(entityId)
    }

    // Queue for server sync
    if (!this.isOnline) {
      await this.enqueueMutation(action, 'transactions', payload, entityId)
    }
  }
}

export const syncManager = new SyncManager()
