import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MONTHS_PT } from '@/lib/constants'

interface ExpenseFiltersProps {
  month: number
  year: number
  view: 'mine' | 'shared' | 'all'
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  onViewChange: (view: 'mine' | 'shared' | 'all') => void
}

const currentYear = new Date().getFullYear()
const YEARS = [currentYear, currentYear - 1, currentYear - 2]

export function ExpenseFilters({ month, year, view, onMonthChange, onYearChange, onViewChange }: ExpenseFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Month/Year selectors */}
      <div className="flex items-center gap-2">
        <Select
          value={String(month)}
          onValueChange={(v) => onMonthChange(Number(v))}
        >
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

        <Select
          value={String(year)}
          onValueChange={(v) => onYearChange(Number(v))}
        >
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

      {/* View toggle */}
      <Tabs value={view} onValueChange={(v) => onViewChange(v as 'mine' | 'shared' | 'all')}>
        <TabsList>
          <TabsTrigger value="mine">Meus Gastos</TabsTrigger>
          <TabsTrigger value="shared">Compartilhados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
