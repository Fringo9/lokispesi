import { useState, useRef, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { Transaction } from '@/types'

// Map icon names to Lucide components
function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  const iconName = icon as keyof typeof LucideIcons
  // Skip non-component exports
  if (iconName === 'createLucideIcon') {
    return <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
  }
  const IconComponent = (LucideIcons as any)[iconName]
  if (!IconComponent || typeof IconComponent !== 'function') {
    return <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
  }
  return <IconComponent size={18} strokeWidth={1.8} style={{ color }} />
}

interface Props {
  transaction: Transaction
  onDelete?: (id: string) => void
}

export default function ExpenseItem({ transaction, onDelete }: Props) {
  const [swiped, setSwiped] = useState(false)
  const startX = useRef(0)
  const isSwiping = useRef(false)

  const isIncome = transaction.type === 'income'
  const category = transaction.category

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    isSwiping.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return
    const diff = startX.current - e.touches[0].clientX
    if (diff > 60) {
      setSwiped(true)
      isSwiping.current = false
    } else if (diff < -40) {
      setSwiped(false)
      isSwiping.current = false
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isSwiping.current = false
  }, [])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) onDelete(transaction.id)
    setSwiped(false)
  }, [onDelete, transaction.id])

  const handleTap = useCallback(() => {
    if (swiped) {
      setSwiped(false)
    }
  }, [swiped])

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border mb-1"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete action behind the card (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={handleDelete}
          className="h-full px-6 bg-expense text-white text-sm font-medium
                     flex items-center gap-2 active:bg-expense/90 transition-colors"
          aria-label={`Elimina ${transaction.description || 'spesa'}`}
        >
          <Trash2 size={18} />
          Elimina
        </button>
      </div>

      {/* Card content */}
      <div
        className={`flex items-center gap-3 p-3 bg-surface transition-transform duration-200 ease-out cursor-pointer ${
          swiped ? '-translate-x-[108px]' : 'translate-x-0'
        }`}
        onClick={handleTap}
      >
        {/* Category icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: category?.color ? category.color + '20' : '#E5E7EB' + '40' }}
        >
          {category ? (
            <CategoryIcon icon={category.icon} color={category.color || '#6B7280'} />
          ) : (
            <div className="w-3 h-3 rounded-full bg-text-tertiary" />
          )}
        </div>

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
          <p className={`text-sm font-semibold font-mono tabular-nums ${
            isIncome ? 'text-income' : 'text-expense'
          }`}>
            {isIncome ? '+' : '−'}€ {transaction.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  )
}
