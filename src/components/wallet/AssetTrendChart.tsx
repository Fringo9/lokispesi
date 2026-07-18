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
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '13px',
            }}
            labelStyle={{ color: '#94A3B8' }}
            formatter={((value: any) => [
              `€ ${(Number(value ?? 0)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
              'Patrimonio',
            ]) as any}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ fill: '#3B82F6', r: 4, strokeWidth: 0 }}
            activeDot={{ fill: '#3B82F6', r: 6, strokeWidth: 2, stroke: '#0F172A' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
