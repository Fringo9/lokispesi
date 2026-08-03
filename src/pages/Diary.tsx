import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import CashFlowCard from '@/components/diary/CashFlowCard'
import MonthlyChart from '@/components/diary/MonthlyChart'
import ExpenseList from '@/components/diary/ExpenseList'
import SearchModal from '@/components/diary/SearchModal'
import AddExpenseModal from '@/components/diary/AddExpenseModal'
import { useUIStore } from '@/stores/uiStore'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useMonthlySummaries } from '@/hooks/useStats'
import { getLastSixMonths, formatMonth } from '@/utils/date'
import type { MonthlySummary, ChartDataPoint } from '@/types'

export default function Diary() {
  const [showSearch, setShowSearch] = useState(false)
  const { activeModal, closeModal } = useUIStore()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Real data hooks
  const { transactions, createTransaction, deleteTransaction } = useTransactions(year, month)
  const { categories } = useCategories()

  const months = getLastSixMonths()
  const currentMonth = months[5].month
  const summaries = useMonthlySummaries(transactions)

  // Monthly summary for the cash flow card
  const monthlySummary = useMemo<MonthlySummary>(() => {
    return summaries.find(s => s.month === currentMonth) || { month: currentMonth, income: 0, expense: 0, net: 0 }
  }, [summaries, currentMonth])

  // Chart data from real summaries
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return summaries.map(s => ({
      name: s.label,
      income: s.income,
      expense: s.expense,
    }))
  }, [summaries])

  // Filtered transactions for current month (already filtered by hook)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
  }, [transactions])

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-text-primary">
            {formatMonth(now)}
          </h1>
          <button
            onClick={() => setShowSearch(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full
                       hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Cerca spese"
          >
            <Search size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        <CashFlowCard summary={monthlySummary} />
        <MonthlyChart data={chartData} />
        <ExpenseList
          transactions={sortedTransactions}
          onDelete={deleteTransaction}
        />
      </div>

      {/* Search Modal */}
      {showSearch && (
        <SearchModal
          transactions={transactions}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Add/Edit Expense Modal */}
      {activeModal === 'addExpense' && (
        <AddExpenseModal
          onClose={closeModal}
          onSave={createTransaction}
          categories={categories}
        />
      )}
      {activeModal === 'editExpense' && (
        <AddExpenseModal
          onClose={closeModal}
          onSave={(data) => {
            // edit mode — for now just create a new one
            // TODO: implement actual edit with updateTransaction
            createTransaction(data)
          }}
          categories={categories}
        />
      )}
    </div>
  )
}
