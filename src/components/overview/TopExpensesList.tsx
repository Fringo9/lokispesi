import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
}

export default function TopExpensesList({ transactions }: Props) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Top 10 spese del mese
      </h2>

      {transactions.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-6">
          Nessuna spesa questo mese
        </p>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <div key={tx.id} className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-xs font-bold text-text-secondary w-5 text-right tabular-nums">
                {i + 1}
              </span>

              {/* Category dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tx.category?.color ?? '#6B7280' }}
              />

              {/* Name */}
              <span className="flex-1 text-sm text-text-primary truncate">
                {tx.description || 'Spesa'}
              </span>

              {/* Amount */}
              <span className="text-sm font-semibold text-expense font-mono flex-shrink-0">
                € {tx.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
