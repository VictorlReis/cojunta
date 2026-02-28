import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyTrend } from '@/hooks/useDashboardData'

interface MonthlyTrendChartProps {
  data: MonthlyTrend[]
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-background p-2 shadow-md text-sm min-w-36">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <span style={{ color: item.color }} className="text-xs">
              {item.name}
            </span>
            <span className="text-xs font-medium">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const hasData = data.some((d) => d.individual > 0 || d.shared > 0)

  if (!hasData) {
    return <EmptyState message="Sem dados para exibir." />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(value: number) => `R$${value}`}
          tick={{ fontSize: 11 }}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="individual"
          name="Individual"
          stroke="#36A2EB"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="shared"
          name="Compartilhado"
          stroke="#FF6384"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
