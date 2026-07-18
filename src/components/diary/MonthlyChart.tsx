import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint } from '@/types'

interface Props {
  data: ChartDataPoint[]
}

export default function MonthlyChart({ data }: Props) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Ultimi 6 mesi
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickFormatter={(v: number) => `€${v / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '13px',
            }}
            labelStyle={{ color: '#94A3B8' }}
            formatter={((value: any, name: any) => [
              `€ ${(Number(value ?? 0)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
              name === 'income' ? 'Entrate' : 'Uscite',
            ]) as any}
          />
          <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} name="income" />
          <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
