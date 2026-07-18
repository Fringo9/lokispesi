import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import TrendChart from '@/components/overview/TrendChart'
import CategoryPieChart from '@/components/overview/CategoryPieChart'
import TopExpensesList from '@/components/overview/TopExpensesList'
import type { Transaction, ChartDataPoint } from '@/types'

// Demo data — will be replaced by useTransactions() + useStats() when auth is connected
const DEMO_TRANSACTIONS: Transaction[] = [
  { id: '1', user_id: 'demo', type: 'expense', amount: 890, description: 'Affitto', transaction_date: '2026-07-01', is_recurring: true, created_at: '', updated_at: '', category: { id: 'd1', user_id: 'demo', name: 'Affitto/Mutuo', icon: 'home', color: '#EF4444', type: 'expense', is_default: true, created_at: '' } },
  { id: '2', user_id: 'demo', type: 'expense', amount: 210, description: 'Bolletta elettrica', transaction_date: '2026-07-05', is_recurring: false, created_at: '', updated_at: '', category: { id: 'd2', user_id: 'demo', name: 'Bollette', icon: 'zap', color: '#F97316', type: 'expense', is_default: true, created_at: '' } },
  { id: '3', user_id: 'demo', type: 'expense', amount: 150, description: 'Spesa settimanale', transaction_date: '2026-07-10', is_recurring: false, created_at: '', updated_at: '', category: { id: 'd3', user_id: 'demo', name: 'Spesa alimentare', icon: 'shopping-cart', color: '#EAB308', type: 'expense', is_default: true, created_at: '' } },
  { id: '4', user_id: 'demo', type: 'expense', amount: 85, description: 'Cena fuori', transaction_date: '2026-07-12', is_recurring: false, created_at: '', updated_at: '', category: { id: 'd4', user_id: 'demo', name: 'Ristoranti', icon: 'utensils-crossed', color: '#EC4899', type: 'expense', is_default: true, created_at: '' } },
  { id: '5', user_id: 'demo', type: 'expense', amount: 45, description: 'Taxi', transaction_date: '2026-07-08', is_recurring: false, created_at: '', updated_at: '', category: { id: 'd5', user_id: 'demo', name: 'Trasporti', icon: 'car', color: '#3B82F6', type: 'expense', is_default: true, created_at: '' } },
  { id: '6', user_id: 'demo', type: 'income', amount: 2500, description: 'Stipendio', transaction_date: '2026-07-15', is_recurring: false, created_at: '', updated_at: '', category: { id: 'd6', user_id: 'demo', name: 'Stipendio', icon: 'briefcase', color: '#22C55E', type: 'income', is_default: true, created_at: '' } },
  { id: '7', user_id: 'demo', type: 'income', amount: 320, description: 'Freelance', transaction_date: '2026-07-20', is_recurring: false, created_at: '', updated_at: '', category: { id: 'd7', user_id: 'demo', name: 'Freelance', icon: 'laptop', color: '#16A34A', type: 'income', is_default: true, created_at: '' } },
]

const PIE_DATA: ChartDataPoint[] = [
  { name: 'Affitto/Mutuo', value: 890, fill: '#EF4444' },
  { name: 'Spesa alimentare', value: 380, fill: '#EAB308' },
  { name: 'Bollette', value: 210, fill: '#F97316' },
  { name: 'Ristoranti', value: 165, fill: '#EC4899' },
  { name: 'Trasporti', value: 120, fill: '#3B82F6' },
  { name: 'Altro', value: 95, fill: '#6B7280' },
]

const TREND_DATA: ChartDataPoint[] = [
  { name: 'Gen', income: 2500, expense: 2100 },
  { name: 'Feb', income: 2500, expense: 1950 },
  { name: 'Mar', income: 3200, expense: 2300 },
  { name: 'Apr', income: 2500, expense: 1800 },
  { name: 'Mag', income: 2500, expense: 2200 },
  { name: 'Giu', income: 2800, expense: 2400 },
  { name: 'Lug', income: 2820, expense: 1380 },
]

export default function Overview() {
  const [period, setPeriod] = useState<'month' | 'year'>('month')

  const topExpenses = useMemo(() =>
    DEMO_TRANSACTIONS
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10),
    []
  )

  const totalIncome = useMemo(() =>
    DEMO_TRANSACTIONS.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    []
  )
  const totalExpense = useMemo(() =>
    DEMO_TRANSACTIONS.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    []
  )

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
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
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
            <p className="text-xl font-bold text-income font-mono">
              € {totalIncome.toLocaleString('it-IT')}
            </p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-border text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingDown size={14} className="text-expense" />
              <span className="text-xs text-text-secondary">Uscite totali</span>
            </div>
            <p className="text-xl font-bold text-expense font-mono">
              € {totalExpense.toLocaleString('it-IT')}
            </p>
          </div>
        </div>

        {/* Net result */}
        <div className="bg-surface rounded-2xl p-4 border border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity size={14} className="text-accent" />
            <span className="text-xs text-text-secondary">Risultato netto</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense'}`}>
            {totalIncome - totalExpense >= 0 ? '+' : ''}€ {(totalIncome - totalExpense).toLocaleString('it-IT')}
          </p>
        </div>

        {/* Trend Chart */}
        <TrendChart data={TREND_DATA} />

        {/* Category Pie */}
        <CategoryPieChart data={PIE_DATA} />

        {/* Top Expenses */}
        <TopExpensesList transactions={topExpenses} />
      </div>
    </div>
  )
}
