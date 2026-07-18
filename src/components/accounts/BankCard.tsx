import { useState } from 'react'
import { Building2, RefreshCw, AlertCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import type { BankAccount } from '@/types'

interface Props {
  account: BankAccount
  onSync: (accountId: string) => Promise<void>
  onRemove: (accountId: string) => void
}

export default function BankCard({ account, onSync, onRemove }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync(account.id)
    } finally {
      setSyncing(false)
    }
  }

  const statusIcon = () => {
    switch (account.status) {
      case 'active':
        return <CheckCircle2 size={14} className="text-income" />
      case 'error':
        return <AlertCircle size={14} className="text-expense" />
      case 'expired':
        return <Clock size={14} className="text-yellow-400" />
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Top section */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Bank logo placeholder */}
          <div className="w-11 h-11 rounded-xl bg-primary/50 flex items-center justify-center flex-shrink-0 border border-border">
            <Building2 size={22} className="text-text-secondary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary truncate">
                {account.account_name || account.institution_name}
              </p>
              {statusIcon()}
            </div>
            <p className="text-xs text-text-secondary truncate">
              {account.institution_name}
            </p>
            <p className="text-[10px] text-text-tertiary font-mono mt-0.5">
              {account.account_iban
                ? `••••${account.account_iban.slice(-4)}`
                : account.account_id.slice(0, 8) + '...'}
            </p>
          </div>

          {account.balance !== undefined && account.balance !== null && (
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold font-mono text-text-primary">
                € {account.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center border-t border-border">
        {/* Sync info */}
        <div className="flex-1 px-4 py-2.5">
          <p className="text-[11px] text-text-secondary">
            {account.last_synced_at
              ? `Ultimo sync: ${new Date(account.last_synced_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
              : 'Da sincronizzare'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex border-l border-border">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`px-3 py-2.5 text-xs font-medium border-r border-border transition-colors ${
              syncing
                ? 'text-text-secondary cursor-wait'
                : 'text-accent hover:text-blue-400 hover:bg-accent/5'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sync...' : 'Sincronizza'}
            </span>
          </button>

          <button
            onClick={() => confirmDelete ? onRemove(account.id) : setConfirmDelete(true)}
            onBlur={() => setTimeout(() => setConfirmDelete(false), 3000)}
            className={`px-3 py-2.5 text-xs font-medium transition-colors ${
              confirmDelete
                ? 'text-expense bg-expense/10'
                : 'text-text-secondary hover:text-expense hover:bg-expense/5'
            }`}
          >
            {confirmDelete ? 'Conferma' : (
              <Trash2 size={12} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
