import { useEffect, useState } from 'react'
import { useOfflineStore } from '@/stores/offlineStore'
import { syncManager } from '@/sync/SyncManager'
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

type SyncPhase = 'idle' | 'syncing' | 'success' | 'error'

export default function SyncStatusIndicator() {
  const { isOnline, isSyncing, lastSyncMessage } = useOfflineStore()
  const [phase, setPhase] = useState<SyncPhase>('idle')
  const [showDetails, setShowDetails] = useState(false)

  // Update phase based on state
  useEffect(() => {
    if (isSyncing) {
      setPhase('syncing')
    } else if (!isOnline) {
      // Don't override during sync attempt
      if (phase !== 'syncing') setPhase('idle')
    }
  }, [isOnline, isSyncing])

  // Auto-hide success after 3s
  useEffect(() => {
    if (lastSyncMessage && !isSyncing) {
      setPhase('success')
      const timer = setTimeout(() => setPhase('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [lastSyncMessage, isSyncing])

  const handleSync = async () => {
    setPhase('syncing')
    try {
      const result = await syncManager.sync()
      if (result.status === 'success') {
        const msg = `Sync: +${result.pushed ?? 0}/-${result.pulled ?? 0}`
        useOfflineStore.getState().setLastSync(msg)
        setPhase('success')
        setTimeout(() => setPhase('idle'), 3000)
      } else if (result.status === 'offline') {
        setPhase('idle')
      } else {
        setPhase('error')
        setTimeout(() => setPhase('idle'), 4000)
      }
    } catch {
      setPhase('error')
      setTimeout(() => setPhase('idle'), 4000)
    }
  }

  // Don't show anything when online and idle with no pending
  if (isOnline && phase === 'idle') return null

  const bgColor =
    phase === 'syncing'
      ? 'bg-accent/10 border-accent/30'
      : phase === 'success'
        ? 'bg-income/10 border-income/30'
        : phase === 'error'
          ? 'bg-expense/10 border-expense/30'
          : 'bg-yellow-500/10 border-yellow-500/30'

  const textColor =
    phase === 'syncing'
      ? 'text-accent'
      : phase === 'success'
        ? 'text-income'
        : phase === 'error'
          ? 'text-expense'
          : 'text-yellow-400'

  return (
    <div className={`px-3 py-1.5 border-b ${bgColor} transition-colors duration-300`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium"
      >
        {phase === 'syncing' && <RefreshCw size={12} className="animate-spin" />}
        {phase === 'success' && <CheckCircle2 size={12} className={textColor} />}
        {phase === 'error' && <AlertCircle size={12} className={textColor} />}
        {!isOnline && phase === 'idle' && <WifiOff size={12} className={textColor} />}

        <span className={textColor}>
          {phase === 'syncing'
            ? 'Sincronizzazione in corso...'
            : phase === 'success'
              ? lastSyncMessage || 'Sync completato'
              : phase === 'error'
                ? 'Errore di sincronizzazione'
                : 'Offline — modifiche in coda'}
        </span>

        {!isOnline && (
          <span className="text-text-tertiary ml-1">({useOfflineStore.getState().pendingCount})</span>
        )}
      </button>

      {/* Expanded details */}
      {showDetails && (
        <div className="mt-1.5 text-center">
          {!isOnline && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="text-xs text-accent font-medium hover:text-accent-bright transition-colors"
            >
              {isSyncing ? 'Sincronizzazione...' : 'Forza sync ora'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
