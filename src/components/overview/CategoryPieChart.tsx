import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { ChartDataPoint } from '@/types'

interface Props {
  data: ChartDataPoint[]
}

export default function CategoryPieChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + (d.value ?? 0), 0)

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Spese per categoria
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '13px',
            }}
            formatter={((value: any, _name: any, props: any) => [
              `€ ${Number(value ?? 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })} (${total > 0 ? ((Number(value ?? 0) / total) * 100).toFixed(1) : '0'}%)`,
              props.payload?.name ?? '',
            ]) as any}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
            <span className="text-xs text-text-secondary">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
