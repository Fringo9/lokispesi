import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useOfflineStore } from '@/stores/offlineStore'
import { syncManager } from '@/sync/SyncManager'
import { localDB } from '@/db/database'
import BottomNav from './BottomNav'
import SyncStatusIndicator from '@/components/ui/SyncStatusIndicator'

function FAB() {
  const { openModal } = useUIStore()
  return (
    <button
      onClick={() => openModal('addExpense')}
      className="fixed z-40 w-14 h-14 rounded-full bg-accent hover:bg-accent
                 text-white shadow-lg shadow-accent/30 flex items-center justify-center
                 transition-transform active:scale-95 left-1/2 -translate-x-1/2"
      style={{
        bottom: `calc(64px + env(safe-area-inset-bottom, 0px) + 12px)`,
      }}
      aria-label="Aggiungi spesa"
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  )
}

export default function AppLayout() {
  const { setPendingCount } = useOfflineStore()

  useEffect(() => {
    syncManager.start()

    const updatePendingCount = async () => {
      const pending = await localDB.getPendingSync()
      setPendingCount(pending.length)
    }
    updatePendingCount()
    const interval = setInterval(updatePendingCount, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex flex-col bg-primary app-shell"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Sync status bar */}
      <SyncStatusIndicator />

      {/* Scrollable content — space for bottom nav (64px) + safe area */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation — fixed to viewport bottom, safe-area-aware */}
      <BottomNav />

      {/* FAB — floating above the bottom nav, centered, no tab overlap */}
      <FAB />
    </div>
  )
}
