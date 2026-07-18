import { useUIStore } from '@/stores/uiStore'
import type { Transaction } from '@/types'

// Map icon names from Lucide — we'll use a dynamic approach in production
// For now, use a fallback icon
function CategoryDot({ color }: { color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: color + '20' }}
    >
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    </div>
  )
}

interface Props {
  transaction: Transaction
}

export default function ExpenseItem({ transaction }: Props) {
  const { openModal } = useUIStore()
  const isIncome = transaction.type === 'income'
  const category = transaction.category

  return (
    <button
      onClick={() => openModal('editExpense', transaction.id)}
      className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border
                 hover:bg-surface/80 transition-colors active:scale-[0.99] text-left"
    >
      {/* Category icon */}
      <CategoryDot color={category?.color ?? '#6B7280'} />

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {transaction.description || (isIncome ? 'Entrata' : 'Spesa')}
        </p>
        {transaction.note && (
          <p className="text-xs text-text-secondary truncate mt-0.5">
            {transaction.note}
          </p>
        )}
        {category && (
          <p className="text-[10px] font-medium mt-0.5" style={{ color: category.color }}>
            {category.name}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold font-mono ${
          isIncome ? 'text-income' : 'text-expense'
        }`}>
          {isIncome ? '+' : '-'}€ {transaction.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </button>
  )
}
