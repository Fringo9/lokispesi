import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import type { MonthlySummary } from '@/types'

interface Props {
  summary: MonthlySummary
}

export default function CashFlowCard({ summary }: Props) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-accent" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Flusso di cassa
        </h2>
      </div>

      {/* Net flow */}
      <div className="text-center mb-4">
        <p className={`text-3xl font-bold font-mono ${
          summary.net >= 0 ? 'text-income' : 'text-expense'
        }`}>
          {summary.net >= 0 ? '+' : ''}{formatCurrency(summary.net)}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          Saldo del mese
        </p>
      </div>

      {/* Income / Expense breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} className="text-income" />
            <span className="text-xs text-text-secondary">Entrate</span>
          </div>
          <p className="text-base font-semibold text-income font-mono">
            {formatCurrency(summary.income)}
          </p>
        </div>
        <div className="bg-primary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown size={14} className="text-expense" />
            <span className="text-xs text-text-secondary">Uscite</span>
          </div>
          <p className="text-base font-semibold text-expense font-mono">
            {formatCurrency(summary.expense)}
          </p>
        </div>
      </div>
    </div>
  )
}
