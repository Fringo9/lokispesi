import { useState } from 'react'
import { Plus, Pencil, Trash2, Wallet as WalletIcon } from 'lucide-react'
import NetWorthCard from '@/components/wallet/NetWorthCard'
import AssetTrendChart from '@/components/wallet/AssetTrendChart'
import WalletEditor from '@/components/wallet/WalletEditor'
import { useWallet } from '@/hooks/useWallet'
import type { ManualWallet, ChartDataPoint } from '@/types'

export default function Wallet() {
  const { wallets, netWorth, createWallet, updateWallet, deleteWallet } = useWallet()
  const [showEditor, setShowEditor] = useState(false)
  const [editingWallet, setEditingWallet] = useState<ManualWallet | null>(null)

  // Trend chart from wallet data (placeholder — real snapshots come from cron)
  const trendData: ChartDataPoint[] = [
    { name: 'Feb', netWorth }, { name: 'Mar', netWorth },
    { name: 'Apr', netWorth }, { name: 'Mag', netWorth },
    { name: 'Giu', netWorth }, { name: 'Lug', netWorth },
  ]

  const handleSave = (wallet: ManualWallet) => {
    if (editingWallet) {
      updateWallet({ id: wallet.id, updates: { name: wallet.name, balance: wallet.balance, type: wallet.type, is_included_in_net_worth: wallet.is_included_in_net_worth } })
    } else {
      createWallet({ name: wallet.name, balance: wallet.balance, type: wallet.type, is_included_in_net_worth: wallet.is_included_in_net_worth })
    }
    setShowEditor(false)
    setEditingWallet(null)
  }

  const walletTypeColor = (type: string) => {
    switch (type) { case 'cash': return 'bg-yellow-400'; case 'savings': return 'bg-blue-400'; case 'investment': return 'bg-purple-400'; default: return 'bg-gray-400' }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto"><h1 className="text-lg font-semibold text-text-primary">Portafoglio</h1></div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        <NetWorthCard total={netWorth} />
        <AssetTrendChart data={trendData} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Portafogli manuali</h2>
            <button onClick={() => { setEditingWallet(null); setShowEditor(true) }}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-bright transition-colors">
              <Plus size={14} /> Aggiungi
            </button>
          </div>

          {wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-3">
                <WalletIcon size={28} className="text-text-secondary" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Nessun portafoglio</h3>
              <p className="text-xs text-text-secondary max-w-xs">Aggiungi conti manuali come contante, risparmi o investimenti.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map(wallet => (
                <div key={wallet.id} className="flex items-center justify-between bg-surface rounded-xl p-4 border border-border hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${walletTypeColor(wallet.type)}`} />
                    <div><p className="text-sm font-medium text-text-primary">{wallet.name}</p><p className="text-xs text-text-secondary capitalize">{wallet.type}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text-primary font-mono tabular-nums">€ {wallet.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                    <button onClick={() => { setEditingWallet(wallet); setShowEditor(true) }} className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-primary/30 transition-all" aria-label="Modifica"><Pencil size={14} /></button>
                    <button onClick={() => deleteWallet(wallet.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-expense hover:bg-expense/10 transition-all" aria-label="Elimina"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <WalletEditor wallet={editingWallet} onSave={handleSave} onClose={() => { setShowEditor(false); setEditingWallet(null) }} />
      )}
    </div>
  )
}
