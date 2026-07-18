import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Wallet as WalletIcon } from 'lucide-react'
import NetWorthCard from '@/components/wallet/NetWorthCard'
import AssetTrendChart from '@/components/wallet/AssetTrendChart'
import WalletEditor from '@/components/wallet/WalletEditor'
import type { ManualWallet, ChartDataPoint } from '@/types'

// Demo trend data until wallet_snapshots are populated
const DEMO_TREND: ChartDataPoint[] = [
  { name: 'Feb', netWorth: 18200 }, { name: 'Mar', netWorth: 19100 },
  { name: 'Apr', netWorth: 20500 }, { name: 'Mag', netWorth: 19800 },
  { name: 'Giu', netWorth: 21000 }, { name: 'Lug', netWorth: 21350 },
]

// Demo wallets — will be replaced by useWallet() hook when auth is connected
const DEMO_WALLETS: ManualWallet[] = [
  { id: 'w1', user_id: 'demo', name: 'Contante', balance: 350, type: 'cash', is_included_in_net_worth: true, created_at: '', updated_at: '' },
  { id: 'w2', user_id: 'demo', name: 'Conto corrente', balance: 12500, type: 'savings', is_included_in_net_worth: true, created_at: '', updated_at: '' },
  { id: 'w3', user_id: 'demo', name: 'Investimenti', balance: 8500, type: 'investment', is_included_in_net_worth: true, created_at: '', updated_at: '' },
]

export default function Wallet() {
  const [wallets, setWallets] = useState<ManualWallet[]>(DEMO_WALLETS)
  const [showEditor, setShowEditor] = useState(false)
  const [editingWallet, setEditingWallet] = useState<ManualWallet | null>(null)

  const netWorth = useMemo(() =>
    wallets.filter(w => w.is_included_in_net_worth).reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  )

  const handleSave = (wallet: ManualWallet) => {
    if (editingWallet) {
      setWallets(prev => prev.map(w => w.id === wallet.id ? wallet : w))
    } else {
      setWallets(prev => [...prev, {
        ...wallet,
        id: crypto.randomUUID(),
        user_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
    }
    setShowEditor(false)
    setEditingWallet(null)
  }

  const handleDelete = (id: string) => {
    setWallets(prev => prev.filter(w => w.id !== id))
  }

  const walletTypeColor = (type: string) => {
    switch (type) {
      case 'cash': return 'bg-yellow-400'
      case 'savings': return 'bg-blue-400'
      case 'investment': return 'bg-purple-400'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-text-primary">Portafoglio</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Net Worth */}
        <NetWorthCard total={netWorth} />

        {/* Trend Chart */}
        <AssetTrendChart data={DEMO_TREND} />

        {/* Manual Wallets */}
        <div>
          <div className="section-header flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Portafogli manuali
            </h2>
            <button
              onClick={() => { setEditingWallet(null); setShowEditor(true) }}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-blue-400 transition-colors"
            >
              <Plus size={14} /> Aggiungi
            </button>
          </div>

          {wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-3">
                <WalletIcon size={28} className="text-text-secondary" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Nessun portafoglio</h3>
              <p className="text-xs text-text-secondary max-w-xs">
                Aggiungi conti manuali come contante, risparmi o investimenti per tracciare il tuo patrimonio.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map(wallet => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between bg-surface rounded-xl p-4 border border-border hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${walletTypeColor(wallet.type)}`} />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{wallet.name}</p>
                      <p className="text-xs text-text-secondary capitalize">{wallet.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text-primary font-mono tabular-nums">
                      € {wallet.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => { setEditingWallet(wallet); setShowEditor(true) }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-primary/30 transition-all"
                      aria-label="Modifica"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(wallet.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-expense hover:bg-expense/10 transition-all"
                      aria-label="Elimina"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <WalletEditor
          wallet={editingWallet}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingWallet(null) }}
        />
      )}
    </div>
  )
}
