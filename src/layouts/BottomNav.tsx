import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Wallet,
  Landmark,
  PieChart,
  Settings,
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

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
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
      </div>
    </nav>
  )
}
