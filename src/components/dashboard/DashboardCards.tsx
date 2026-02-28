import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { MonthSummary } from '@/hooks/useDashboardData'

interface DashboardCardsProps {
  summary: MonthSummary
}

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(value)}</div>
      </CardContent>
    </Card>
  )
}

export function DashboardCards({ summary }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Total do Mes" value={summary.totalExpenses} />
      <StatCard label="Meus Gastos" value={summary.myExpenses} />
      <StatCard label="Compartilhados" value={summary.sharedExpenses} />
      <StatCard label="Parceiro(a)" value={summary.partnerExpenses} />
    </div>
  )
}
