import { useMemo } from 'react'
import ExpenseItem from './ExpenseItem'
import { formatDayHeader } from '@/utils/date'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
}

function groupByDay(txs: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const key = tx.transaction_date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }
  return groups
}

export default function ExpenseList({ transactions }: Props) {
  const dayGroups = useMemo(() => {
    const groups = groupByDay(transactions)
    // Sort days descending
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [transactions])

  if (dayGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Nessuna spesa</h3>
        <p className="text-xs text-text-secondary">
          Inizia aggiungendo una spesa con il pulsante +
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Spese del mese
      </h2>
      <div className="space-y-4">
        {dayGroups.map(([date, txs]) => (
          <div key={date}>
            {/* Day header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-text-secondary">
                {formatDayHeader(new Date(date + 'T00:00:00'))}
              </span>
              <span className="text-xs text-text-secondary font-mono">
                € {txs.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0).toFixed(2)}
              </span>
            </div>

            {/* Transactions for the day */}
            <div className="space-y-1">
              {txs
                .sort((a, b) => b.amount - a.amount)
                .map(tx => (
                  <ExpenseItem key={tx.id} transaction={tx} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
