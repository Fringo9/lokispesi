import { create } from 'zustand'
import { syncManager } from '@/sync/SyncManager'

interface OfflineState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncAt: string | null
  lastSyncMessage: string | null

  setOnline: (online: boolean) => void
  setSyncing: (syncing: boolean) => void
  setPendingCount: (count: number) => void
  setLastSync: (message: string) => void
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  lastSyncMessage: null,

  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setLastSync: (message) =>
    set({ lastSyncAt: new Date().toISOString(), lastSyncMessage: message }),
}))

// Initialize listeners
if (typeof window !== 'undefined') {
  syncManager.onConnectivityChange((online) => {
    useOfflineStore.getState().setOnline(online)
  })
}
