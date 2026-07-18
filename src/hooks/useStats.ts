import { useMemo } from 'react'
import type { Transaction, ChartDataPoint } from '@/types'
import { getLastSixMonths } from '@/utils/date'

/**
 * Compute monthly summaries from transactions
 */
export function useMonthlySummaries(transactions: Transaction[]) {
  const months = getLastSixMonths()

  return useMemo(() => {
    const summaries = months.map((m) => {
      const monthTxs = transactions.filter(
        (tx) => tx.transaction_date.startsWith(m.month)
      )
      const income = monthTxs
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = monthTxs
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      return { month: m.month, label: m.label, income, expense, net: income - expense }
    })
    return summaries
  }, [transactions, months])
}

/**
 * Compute category breakdown for pie chart
 */
export function useCategoryBreakdown(transactions: Transaction[]): ChartDataPoint[] {
  return useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense')
    const categoryMap = new Map<string, { name: string; value: number; fill: string }>()

    for (const tx of expenses) {
      const cat = tx.category
      const key = cat?.id ?? 'uncategorized'
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          name: cat?.name ?? 'Senza categoria',
          value: 0,
          fill: cat?.color ?? '#6B7280',
        })
      }
      categoryMap.get(key)!.value += tx.amount
    }

    return [...categoryMap.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [transactions])
}

/**
 * Get top N expenses for a period
 */
export function useTopExpenses(
  transactions: Transaction[],
  limit: number = 10
): Transaction[] {
  return useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit)
  }, [transactions, limit])
}

/**
 * Monthly trend chart data (for overview page)
 */
export function useTrendData(transactions: Transaction[]): ChartDataPoint[] {
  const months = getLastSixMonths()

  return useMemo(() => {
    return months.map((m) => {
      const monthTxs = transactions.filter(
        (tx) => tx.transaction_date.startsWith(m.month)
      )
      return {
        name: m.label,
        income: monthTxs
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        expense: monthTxs
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
      }
    })
  }, [transactions, months])
}
