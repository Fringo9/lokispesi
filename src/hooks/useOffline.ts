import { useState, useEffect, useCallback } from 'react'
import { syncManager } from '@/sync/SyncManager'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = syncManager.onConnectivityChange(setIsOnline)
    return unsubscribe
  }, [])

  const triggerSync = useCallback(async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      const result = await syncManager.sync()
      if (result.status === 'success') {
        setLastSyncResult(
          `Sync completato: ${result.pushed ?? 0} inviati, ${result.pulled ?? 0} ricevuti`
        )
      } else if (result.status === 'offline') {
        setLastSyncResult('Offline — sync in attesa')
      }
    } catch (err) {
      setLastSyncResult('Errore sync')
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) triggerSync()
  }, [isOnline])

  return {
    isOnline,
    isSyncing,
    lastSyncResult,
    triggerSync,
  }
}
