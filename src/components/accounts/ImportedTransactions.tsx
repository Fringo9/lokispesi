import { useState } from 'react'
import { CheckCircle2, Clock, Link, X, ArrowRightLeft } from 'lucide-react'
import { useReconciliation, type ReconciliationMatch } from '@/hooks/useReconciliation'
import type { BankAccount } from '@/types'

interface Props {
  account: BankAccount
}

export default function ImportedTransactions({ account }: Props) {
  const [showAll, setShowAll] = useState(false)
  const { result, isLoading, acceptMatch } = useReconciliation(account.id)

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl p-5 border border-border animate-pulse">
        <div className="h-4 w-48 bg-border rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-primary/30 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!result || result.matches.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-6 border border-border text-center">
        <ArrowRightLeft size={24} className="text-text-secondary mx-auto mb-2" />
        <p className="text-sm text-text-secondary">
          Nessuna transazione da importare
        </p>
      </div>
    )
  }

  const matches = showAll ? result.matches : result.matches.filter(m => m.confidence !== 'high')

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-accent" />
            Transazioni importate
          </h3>
          <span className="text-xs text-text-secondary">
            {result.total} totali
          </span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-income">
            <CheckCircle2 size={10} />
            {result.reconciled} riconciliate
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <Link size={10} />
            {result.suggested} suggerite
          </span>
          <span className="flex items-center gap-1 text-text-secondary">
            <X size={10} />
            {result.unmatched} senza match
          </span>
        </div>
      </div>

      {/* Match cards */}
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {matches.map((match, i) => (
          <MatchCard
            key={match.bank_tx_id || i}
            match={match}
            onAccept={() => {
              if (match.manual_tx_id) {
                acceptMatch({ manualTxId: match.manual_tx_id, bankTxId: match.bank_tx_id })
              }
            }}
          />
        ))}

        {matches.length === 0 && (
          <div className="p-6 text-center">
            <CheckCircle2 size={20} className="text-income mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              Tutte le transazioni sono state riconciliate!
            </p>
          </div>
        )}
      </div>

      {/* Toggle show all */}
      {result.reconciled > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2.5 text-xs font-medium text-accent hover:text-blue-400 border-t border-border transition-colors"
        >
          {showAll
            ? 'Nascondi transazioni riconciliate'
            : `Mostra tutte (${result.total})`}
        </button>
      )}
    </div>
  )
}

function MatchCard({
  match,
  onAccept,
}: {
  match: ReconciliationMatch
  onAccept: () => void
}) {
  const badge = () => {
    switch (match.confidence) {
      case 'high':
        return (
          <span className="flex items-center gap-1 text-[10px] text-income bg-income/10 px-1.5 py-0.5 rounded-full">
            <CheckCircle2 size={9} /> Riconciliata
          </span>
        )
      case 'medium':
        return (
          <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full">
            <Link size={9} /> Suggerita
          </span>
        )
      case 'none':
        return (
          <span className="flex items-center gap-1 text-[10px] text-text-secondary bg-primary/30 px-1.5 py-0.5 rounded-full">
            <Clock size={9} /> Nuova
          </span>
        )
    }
  }

  return (
    <div className="p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {badge()}
          <span className="text-[10px] text-text-tertiary">{match.reason}</span>
        </div>
        <p className="text-xs text-text-secondary truncate">
          Bank TX: {match.bank_tx_id.slice(0, 8)}...
          {match.manual_tx_id && (
            <span className="text-text-tertiary ml-1">
              → Manual: {match.manual_tx_id.slice(0, 8)}...
            </span>
          )}
        </p>
      </div>

      {match.confidence === 'medium' && match.manual_tx_id && (
        <button
          onClick={onAccept}
          className="flex-shrink-0 text-[10px] font-medium text-accent bg-accent/10 hover:bg-accent/20
                     px-2.5 py-1 rounded-lg transition-colors"
        >
          Accetta
        </button>
      )}

      {match.confidence === 'none' && (
        <button
          onClick={onAccept}
          className="flex-shrink-0 text-[10px] font-medium text-text-secondary bg-primary/50 hover:bg-primary
                     px-2.5 py-1 rounded-lg transition-colors"
        >
          Crea spesa
        </button>
      )}
    </div>
  )
}
