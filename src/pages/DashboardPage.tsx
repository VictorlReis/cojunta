import { useState } from 'react'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardCards } from '@/components/dashboard/DashboardCards'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart'
import { PendingInvitations } from '@/components/partnership/PendingInvitations'
import { useDashboardData } from '@/hooks/useDashboardData'
import { usePartnership } from '@/hooks/usePartnership'
import { useInvitations } from '@/hooks/useInvitations'
import { MONTHS_PT } from '@/lib/constants'
import type { Invitation } from '@/types/database'

interface ReceivedInvitation extends Invitation {
  inviter?: {
    display_name: string
    email: string
  }
}

const currentYear = new Date().getFullYear()
const YEARS = [currentYear, currentYear - 1, currentYear - 2]

interface MonthYearSelectorProps {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

function MonthYearSelector({ month, year, onChange }: MonthYearSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={String(month)} onValueChange={(v) => onChange(Number(v), year)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS_PT.map((m) => (
            <SelectItem key={m.value} value={String(m.value)}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(year)} onValueChange={(v) => onChange(month, Number(v))}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CardSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { monthSummary, trendData, isLoading } = useDashboardData(month, year)
  const { isLinked } = usePartnership()
  const { received } = useInvitations()

  return (
    <div className="space-y-6">
      {/* Page header with month selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Painel</h1>
        <MonthYearSelector
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m)
            setYear(y)
          }}
        />
      </div>

      {/* Pending invitations banner */}
      {received.length > 0 && (
        <PendingInvitations invitations={received as ReceivedInvitation[]} />
      )}

      {/* Partner prompt if not linked */}
      {!isLinked && received.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 py-4">
            <Users className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="font-medium">Conecte-se com seu parceiro(a)</p>
              <p className="text-sm text-muted-foreground">
                Va em Configuracoes para enviar um convite e compartilhar despesas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {isLoading ? <CardSkeletons /> : <DashboardCards summary={monthSummary} />}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <CategoryPieChart data={monthSummary.byCategory} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolucao Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <MonthlyTrendChart data={trendData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
