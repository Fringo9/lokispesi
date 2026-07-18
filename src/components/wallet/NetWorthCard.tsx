import { formatCurrency } from '@/utils/currency'

interface Props {
  total: number
}

export default function NetWorthCard({ total }: Props) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border text-center">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
        Patrimonio totale
      </p>
      <p className="text-4xl font-bold font-mono text-text-primary">
        {formatCurrency(total)}
      </p>
    </div>
  )
}
