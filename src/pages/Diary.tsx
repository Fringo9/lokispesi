import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import CashFlowCard from '@/components/diary/CashFlowCard'
import MonthlyChart from '@/components/diary/MonthlyChart'
import ExpenseList from '@/components/diary/ExpenseList'
import SearchModal from '@/components/diary/SearchModal'
import { getCurrentMonth, getLastSixMonths } from '@/utils/date'
import type { Transaction, MonthlySummary, ChartDataPoint } from '@/types'

// Fallback demo data when no auth or no data
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: '1', user_id: 'demo', type: 'expense', amount: 45.50,
    description: 'Spesa supermercato', category_id: 'd1',
    transaction_date: '2026-07-17', is_recurring: false,
    created_at: '', updated_at: '',
    category: { id: 'd1', user_id: 'demo', name: 'Spesa alimentare', icon: 'shopping-cart', color: '#EAB308', type: 'expense', is_default: true, created_at: '' }
  },
  {
    id: '2', user_id: 'demo', type: 'expense', amount: 12.00,
    description: 'Pranzo fuori', category_id: 'd2',
    transaction_date: '2026-07-17', is_recurring: false,
    created_at: '', updated_at: '',
    category: { id: 'd2', user_id: 'demo', name: 'Ristoranti', icon: 'utensils-crossed', color: '#EC4899', type: 'expense', is_default: true, created_at: '' }
  },
  {
    id: '3', user_id: 'demo', type: 'income', amount: 2500.00,
    description: 'Stipendio luglio', category_id: 'd3',
    transaction_date: '2026-07-15', is_recurring: false,
    created_at: '', updated_at: '',
    category: { id: 'd3', user_id: 'demo', name: 'Stipendio', icon: 'briefcase', color: '#22C55E', type: 'income', is_default: true, created_at: '' }
  },
  {
    id: '4', user_id: 'demo', type: 'expense', amount: 890.00,
    description: 'Affitto', category_id: 'd4',
    transaction_date: '2026-07-01', is_recurring: true,
    created_at: '', updated_at: '',
    category: { id: 'd4', user_id: 'demo', name: 'Affitto/Mutuo', icon: 'home', color: '#EF4444', type: 'expense', is_default: true, created_at: '' }
  },
]

export default function Diary() {
  const [showSearch, setShowSearch] = useState(false)
  const { start, end } = getCurrentMonth()
  const months = getLastSixMonths()
  const currentMonth = months[5].month

  // In production, use: const { transactions } = useTransactions(year, month)
  // For now, use demo data since there's no auth
  const transactions = DEMO_TRANSACTIONS

  const monthlySummary = useMemo<MonthlySummary>(() => {
    const income = transactions
      .filter(t => t.type === 'income' && t.transaction_date >= start && t.transaction_date <= end)
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions
      .filter(t => t.type === 'expense' && t.transaction_date >= start && t.transaction_date <= end)
      .reduce((sum, t) => sum + t.amount, 0)
    return { month: currentMonth, income, expense, net: income - expense }
  }, [transactions, start, end])

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return months.map(m => ({
      name: m.label,
      income: m.month === currentMonth ? monthlySummary.income : Math.round(Math.random() * 1500 + 2000),
      expense: m.month === currentMonth ? monthlySummary.expense : Math.round(Math.random() * 1200 + 500),
    }))
  }, [months, monthlySummary])

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.transaction_date >= start && t.transaction_date <= end)
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
  }, [transactions, start, end])

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-text-primary">Luglio 2026</h1>
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
        {/* Cash Flow Card */}
        <CashFlowCard summary={monthlySummary} />

        {/* 6-Month Chart */}
        <MonthlyChart data={chartData} />

        {/* Expense List */}
        <ExpenseList transactions={filteredTransactions} />
      </div>

      {/* Search Modal */}
      {showSearch && (
        <SearchModal
          transactions={transactions}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}
