import { useState } from 'react'
import { X, ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import type { TransactionType, ExpenseFormData } from '@/types'

interface Props {
  onClose: () => void
  initialData?: Partial<ExpenseFormData>
}

// Demo categories
const CATEGORIES = {
  income: [
    { id: 'cat-salary', name: 'Stipendio', icon: 'briefcase', color: '#22C55E' },
    { id: 'cat-freelance', name: 'Freelance', icon: 'laptop', color: '#16A34A' },
    { id: 'cat-other-income', name: 'Altro (entrate)', icon: 'ellipsis', color: '#6B7280' },
  ],
  expense: [
    { id: 'cat-rent', name: 'Affitto/Mutuo', icon: 'home', color: '#EF4444' },
    { id: 'cat-bills', name: 'Bollette', icon: 'zap', color: '#F97316' },
    { id: 'cat-groceries', name: 'Spesa alimentare', icon: 'shopping-cart', color: '#EAB308' },
    { id: 'cat-transport', name: 'Trasporti', icon: 'car', color: '#3B82F6' },
    { id: 'cat-restaurants', name: 'Ristoranti', icon: 'utensils-crossed', color: '#EC4899' },
    { id: 'cat-health', name: 'Salute', icon: 'heart-pulse', color: '#14B8A6' },
    { id: 'cat-entertainment', name: 'Intrattenimento', icon: 'tv', color: '#8B5CF6' },
    { id: 'cat-clothing', name: 'Abbigliamento', icon: 'shirt', color: '#F43F5E' },
    { id: 'cat-other-expense', name: 'Altro', icon: 'ellipsis', color: '#6B7280' },
  ],
}

export default function AddExpenseModal({ onClose, initialData }: Props) {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense')
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '')
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category_id ?? '')
  const [date, setDate] = useState(initialData?.transaction_date ?? new Date().toISOString().split('T')[0])
  const [note, setNote] = useState(initialData?.note ?? '')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense

  const handleNumpad = (digit: string) => {
    if (digit === 'backspace') {
      setAmount(prev => prev.slice(0, -1))
    } else if (digit === '.') {
      if (!amount.includes('.') && amount.length > 0) {
        setAmount(prev => prev + '.')
      }
    } else {
      // Max 9 digits total, max 2 decimal places
      const parts = amount.split('.')
      if (parts[0].length >= 7) return
      if (parts.length === 2 && parts[1].length >= 2) return
      setAmount(prev => prev + digit)
    }
  }

  const handleSave = () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return
    if (!selectedCategory) return

    const data: ExpenseFormData = {
      amount: numAmount,
      type,
      category_id: selectedCategory,
      transaction_date: date,
      note: note || undefined,
      description: note || undefined,
    }

    console.log('Saving expense:', data)
    // TODO: Call mutation
    onClose()
  }

  const isValid = amount && parseFloat(amount) > 0 && selectedCategory

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-border border-b-0
                      animate-slide-up max-h-[90dvh] overflow-y-auto">
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="text-lg font-semibold text-text-primary">
            {initialData ? 'Modifica' : 'Nuova'} {type === 'income' ? 'entrata' : 'spesa'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full
                       hover:bg-primary/50 transition-colors text-text-secondary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Type toggle */}
          <div className="flex bg-primary/50 rounded-xl p-1">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setType(t); setSelectedCategory('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  type === t
                    ? t === 'expense'
                      ? 'bg-expense text-white shadow-sm'
                      : 'bg-income text-white shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                {t === 'expense' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                {t === 'expense' ? 'Uscita' : 'Entrata'}
              </button>
            ))}
          </div>

          {/* Amount display + numeric keypad */}
          <div>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold font-mono text-text-primary tracking-tight">
                € {amount || '0'}
              </p>
            </div>

            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9','.','0','backspace'].map(key => (
                <button
                  key={key}
                  onClick={() => handleNumpad(key)}
                  className="h-14 flex items-center justify-center rounded-xl bg-primary/50
                             hover:bg-primary/70 active:scale-95 transition-all text-lg font-medium text-text-primary"
                >
                  {key === 'backspace' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  ) : (
                    key
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category picker */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Categoria
            </label>
            <button
              onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              className="w-full flex items-center justify-between bg-primary/50 rounded-xl px-4 py-3
                         border border-border hover:border-accent/30 transition-colors"
            >
              {selectedCategory ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categories.find(c => c.id === selectedCategory)?.color }}
                  />
                  <span className="text-sm text-text-primary">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-text-secondary">Seleziona categoria</span>
              )}
              <ChevronDown size={16} className="text-text-secondary" />
            </button>

            {showCategoryPicker && (
              <div className="mt-2 bg-primary/50 rounded-xl border border-border overflow-hidden">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      setShowCategoryPicker(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors
                                ${selectedCategory === cat.id ? 'bg-surface' : ''}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                    <span className="text-sm text-text-primary">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border
                         text-sm text-text-primary outline-none focus:border-accent/30
                         [color-scheme:dark]"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Nota <span className="text-text-secondary font-normal normal-case">(opzionale)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Aggiungi una nota..."
              rows={2}
              className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border
                         text-sm text-text-primary placeholder:text-text-secondary outline-none
                         focus:border-accent/30 resize-none [color-scheme:dark]"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
              isValid
                ? 'bg-accent text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-accent/25'
                : 'bg-border text-text-secondary cursor-not-allowed'
            }`}
          >
            {type === 'income' ? 'Aggiungi entrata' : 'Aggiungi spesa'}
          </button>
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}
