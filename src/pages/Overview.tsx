import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import TrendChart from '@/components/overview/TrendChart'
import CategoryPieChart from '@/components/overview/CategoryPieChart'
import TopExpensesList from '@/components/overview/TopExpensesList'
import { useTransactions } from '@/hooks/useTransactions'
import { useTrendData, useCategoryBreakdown, useTopExpenses } from '@/hooks/useStats'
import { formatCurrency } from '@/utils/currency'

export default function Overview() {
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { transactions } = useTransactions(year, month)
  const trendData = useTrendData(transactions)
  const categoryData = useCategoryBreakdown(transactions)
  const topExpenses = useTopExpenses(transactions, 10)

  const totalIncome = useMemo(() =>
    transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [transactions]
  )
  const totalExpense = useMemo(() =>
    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  )
  const net = totalIncome - totalExpense

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-text-primary">Panoramica</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Period Selector */}
        <div className="flex bg-surface rounded-lg p-1">
          {(['month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${period === p ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {p === 'month' ? 'Mensile' : 'Annuale'}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-2xl p-4 border border-border text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-income" />
              <span className="text-xs text-text-secondary">Entrate totali</span>
            </div>
            <p className="text-xl font-bold text-income font-mono">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-border text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingDown size={14} className="text-expense" />
              <span className="text-xs text-text-secondary">Uscite totali</span>
            </div>
            <p className="text-xl font-bold text-expense font-mono">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Net result */}
        <div className="bg-surface rounded-2xl p-4 border border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity size={14} className="text-accent" />
            <span className="text-xs text-text-secondary">Risultato netto</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${net >= 0 ? 'text-income' : 'text-expense'}`}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </p>
        </div>

        <TrendChart data={trendData} />
        <CategoryPieChart data={categoryData} />
        <TopExpensesList transactions={topExpenses} />
      </div>
    </div>
  )
}
