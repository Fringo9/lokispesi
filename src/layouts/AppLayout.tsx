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

  // Initialize sync engine on mount
  useEffect(() => {
    syncManager.start()

    // Periodically check pending count
    const updatePendingCount = async () => {
      const pending = await localDB.getPendingSync()
      setPendingCount(pending.length)
    }
    updatePendingCount()
    const interval = setInterval(updatePendingCount, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-dvh bg-primary">
      {/* Sync status bar */}
      <SyncStatusIndicator />

      {/* Content area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      {activeModal === 'addExpense' && <AddExpenseModal onClose={closeModal} />}
      {activeModal === 'editExpense' && <AddExpenseModal onClose={closeModal} initialData={{}} />}
    </div>
  )
}
