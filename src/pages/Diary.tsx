import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, subMonths } from 'date-fns'
import CashFlowCard from '@/components/diary/CashFlowCard'
import MonthlyChart from '@/components/diary/MonthlyChart'
import ExpenseList from '@/components/diary/ExpenseList'
import SearchModal from '@/components/diary/SearchModal'
import AddExpenseModal from '@/components/diary/AddExpenseModal'
import { useUIStore } from '@/stores/uiStore'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useMonthlySummaries } from '@/hooks/useStats'
import { formatMonth } from '@/utils/date'
import type { MonthlySummary, ChartDataPoint, ExpenseFormData } from '@/types'

export default function Diary() {
  const [showSearch, setShowSearch] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const { activeModal, closeModal } = useUIStore()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1

  const { transactions, createTransaction, deleteTransaction } = useTransactions(year, month)
  const { categories } = useCategories()
  const summaries = useMonthlySummaries(transactions)

  const prevMonth = () => setViewDate(d => subMonths(d, 1))
  const nextMonth = () => setViewDate(d => addMonths(d, 1))

  const handleSave = (data: ExpenseFormData) => {
    createTransaction(data)
    closeModal()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Eliminare questa spesa?')) {
      deleteTransaction(id)
    }
  }

  const monthlySummary = useMemo<MonthlySummary>(() => {
    const currentKey = `${year}-${String(month).padStart(2, '0')}`
    return summaries.find(s => s.month === currentKey)
      || { month: currentKey, income: 0, expense: 0, net: 0 }
  }, [summaries, year, month])

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return summaries.map(s => ({
      name: s.label,
      income: s.income,
      expense: s.expense,
    }))
  }, [summaries])

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
  }, [transactions])

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1

  return (
    <div className="min-h-full">
      {/* Header with month navigation */}
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full
                       hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Mese precedente"
          >
            <ChevronLeft size={20} />
          </button>

          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            {formatMonth(viewDate)}
            {isCurrentMonth && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" title="Mese corrente" />
            )}
          </h1>

          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              isCurrentMonth
                ? 'text-text-tertiary cursor-not-allowed'
                : 'hover:bg-surface text-text-secondary hover:text-text-primary'
            }`}
            aria-label="Mese successivo"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Search bar */}
        <div className="max-w-lg mx-auto mt-2">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-2 bg-surface rounded-xl px-4 py-2.5 border border-border
                       text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
          >
            <Search size={16} />
            Cerca spese...
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        <CashFlowCard summary={monthlySummary} />
        <MonthlyChart data={chartData} />
        <ExpenseList
          transactions={sortedTransactions}
          onDelete={handleDelete}
        />
      </div>

      {showSearch && (
        <SearchModal
          transactions={transactions}
          onClose={() => setShowSearch(false)}
        />
      )}

      {activeModal === 'addExpense' && (
        <AddExpenseModal
          onClose={closeModal}
          onSave={handleSave}
          categories={categories}
        />
      )}
    </div>
  )
}
