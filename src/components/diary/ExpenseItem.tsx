import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import type { Transaction } from '@/types'

function CategoryDot({ color }: { color: string }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '20' }}>
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    </div>
  )
}

interface Props {
  transaction: Transaction
  onDelete?: (id: string) => void
}

export default function ExpenseItem({ transaction, onDelete }: Props) {
  const { openModal } = useUIStore()
  const [swiped, setSwiped] = useState(false)
  const isIncome = transaction.type === 'income'
  const category = transaction.category

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm('Eliminare questa spesa?')) {
      onDelete(transaction.id)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl mb-1 group">
      {/* Delete action behind the card */}
      <button
        onClick={handleDelete}
        className="absolute right-0 top-0 bottom-0 w-16 bg-expense flex items-center justify-center rounded-r-xl"
      >
        <Trash2 size={18} className="text-white" />
      </button>

      {/* Main card */}
      <button
        onClick={() => openModal('editExpense', transaction.id)}
        className={`w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-border
                   hover:bg-surface/80 transition-colors active:scale-[0.99] text-left relative z-10
                   ${swiped ? 'translate-x-[-64px]' : ''} transition-transform duration-200`}
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX
          const handleMove = (ev: TouchEvent) => {
            const diff = startX - ev.touches[0].clientX
            setSwiped(diff > 40)
          }
          const handleEnd = () => {
            document.removeEventListener('touchmove', handleMove)
            document.removeEventListener('touchend', handleEnd)
          }
          document.addEventListener('touchmove', handleMove)
          document.addEventListener('touchend', handleEnd)
        }}
      >
        <CategoryDot color={category?.color ?? '#6B7280'} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {transaction.description || (isIncome ? 'Entrata' : 'Spesa')}
          </p>
          {transaction.note && (
            <p className="text-xs text-text-secondary truncate mt-0.5">{transaction.note}</p>
          )}
          {category && (
            <p className="text-[10px] font-medium mt-0.5" style={{ color: category.color }}>{category.name}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0 flex items-center gap-1">
          <p className={`text-sm font-semibold font-mono ${isIncome ? 'text-income' : 'text-expense'}`}>
            {isIncome ? '+' : '-'}€ {transaction.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="w-6 h-6 flex items-center justify-center rounded-full text-text-secondary hover:text-expense hover:bg-expense/10 transition-all ml-1"
              aria-label="Elimina"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </button>
    </div>
  )
}
