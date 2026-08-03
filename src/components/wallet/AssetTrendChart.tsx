import {
  LineChart,
  Line,
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

export default function AssetTrendChart({ data }: Props) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Andamento patrimonio
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickFormatter={(v: number) => `€${v / 1000}k`}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              fontSize: '13px',
            }}
            labelStyle={{ color: '#6B7280' }}
            formatter={((value: any) => [
              `€ ${(Number(value ?? 0)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
              'Patrimonio',
            ]) as any}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#5B8CB8"
            strokeWidth={2.5}
            dot={{ fill: '#5B8CB8', r: 4, strokeWidth: 0 }}
            activeDot={{ fill: '#5B8CB8', r: 6, strokeWidth: 2, stroke: '#F8F9FA' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
