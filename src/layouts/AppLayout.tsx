import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useOfflineStore } from '@/stores/offlineStore'
import { syncManager } from '@/sync/SyncManager'
import { localDB } from '@/db/database'
import BottomNav from './BottomNav'
import SyncStatusIndicator from '@/components/ui/SyncStatusIndicator'
import AddExpenseModal from '@/components/diary/AddExpenseModal'

export default function AppLayout() {
  const { activeModal, closeModal } = useUIStore()
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

      {/* Modals */}
      {activeModal === 'addExpense' && <AddExpenseModal onClose={closeModal} />}
      {activeModal === 'editExpense' && <AddExpenseModal onClose={closeModal} initialData={{}} />}
    </div>
  )
}
