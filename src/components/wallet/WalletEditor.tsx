import { useState } from 'react'
import { X } from 'lucide-react'
import type { ManualWallet, WalletType } from '@/types'

interface Props {
  wallet: ManualWallet | null
  onSave: (wallet: ManualWallet) => void
  onClose: () => void
}

const WALLET_TYPES: { value: WalletType; label: string }[] = [
  { value: 'cash', label: 'Contante' },
  { value: 'savings', label: 'Risparmio' },
  { value: 'investment', label: 'Investimenti' },
  { value: 'other', label: 'Altro' },
]

export default function WalletEditor({ wallet, onSave, onClose }: Props) {
  const [name, setName] = useState(wallet?.name ?? '')
  const [balance, setBalance] = useState(wallet?.balance.toString() ?? '')
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'savings')
  const [included, setIncluded] = useState(wallet?.is_included_in_net_worth ?? true)

  const handleSave = () => {
    if (!name.trim() || !balance) return
    onSave({
      id: wallet?.id ?? '',
      user_id: wallet?.user_id ?? 'u1',
      name: name.trim(),
      balance: parseFloat(balance),
      type,
      is_included_in_net_worth: included,
      created_at: wallet?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-border border-b-0 p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-text-primary">
            {wallet ? 'Modifica portafoglio' : 'Nuovo portafoglio'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es. Conto corrente"
              className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Saldo (€)
            </label>
            <input
              type="number"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WALLET_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    type === t.value
                      ? 'bg-accent text-white'
                      : 'bg-primary/50 text-text-secondary border border-border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={included}
              onChange={e => setIncluded(e.target.checked)}
              className="w-5 h-5 rounded accent-accent"
            />
            <span className="text-sm text-text-primary">Includi nel patrimonio totale</span>
          </label>

          <button
            onClick={handleSave}
            disabled={!name.trim() || !balance}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
              name.trim() && balance
                ? 'bg-accent text-white hover:bg-blue-600 active:scale-[0.98]'
                : 'bg-border text-text-secondary cursor-not-allowed'
            }`}
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  )
}
