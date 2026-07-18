import { useState, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import ExpenseItem from './ExpenseItem'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
  onClose: () => void
}

export default function SearchModal({ transactions, onClose }: Props) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return transactions.filter(tx => {
      const matchesName = tx.description?.toLowerCase().includes(q)
      const matchesAmount = tx.amount.toString().includes(q)
      const matchesCategory = tx.category?.name.toLowerCase().includes(q)
      return matchesName || matchesAmount || matchesCategory
    })
  }, [query, transactions])

  return (
    <div className="fixed inset-0 z-50 bg-primary">
      {/* Search header */}
      <div className="sticky top-0 bg-primary border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 flex items-center gap-2 bg-surface rounded-xl px-4 py-2.5 border border-border">
            <Search size={18} className="text-text-secondary flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca per nome, importo o categoria..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary
                         outline-none border-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-sm text-accent font-medium hover:text-blue-400 flex-shrink-0"
          >
            Annulla
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {query.trim() === '' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={36} className="text-text-secondary mb-3" />
            <p className="text-sm text-text-secondary">
              Cerca tra le tue spese per nome, importo o categoria
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-text-secondary">
              Nessun risultato per "{query}"
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-text-secondary mb-2">
              {results.length} risultato{results.length !== 1 ? 'i' : ''}
            </p>
            {results.map(tx => (
              <ExpenseItem key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
