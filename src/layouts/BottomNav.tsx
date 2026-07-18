import { useLocation, useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import {
  BookOpen,
  Wallet,
  Landmark,
  PieChart,
  Settings,
  Plus,
} from 'lucide-react'

const tabs = [
  { path: '/app/diary', icon: BookOpen, label: 'Diario' },
  { path: '/app/wallet', icon: Wallet, label: 'Portafoglio' },
  { path: '/app/accounts', icon: Landmark, label: 'Conti' },
  { path: '/app/overview', icon: PieChart, label: 'Panoramica' },
  { path: '/app/settings', icon: Settings, label: 'Impostazioni' },
] as const

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { openModal } = useUIStore()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                active ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <tab.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium leading-tight">
                {tab.label}
              </span>
            </button>
          )
        })}

        {/* FAB - centered between tabs 0 and 1 (Diario position) */}
        <button
          onClick={() => openModal('addExpense')}
          className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-accent hover:bg-blue-600
                     text-white shadow-lg shadow-accent/30 flex items-center justify-center
                     transition-transform active:scale-95"
          aria-label="Aggiungi spesa"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  )
}
