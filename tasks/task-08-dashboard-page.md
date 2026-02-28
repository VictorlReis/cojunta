# Task 08: Dashboard Page -- Assembly and Integration

## Objective
Build the DashboardPage that assembles the summary cards, category pie chart, monthly trend line chart, and a month selector into a cohesive dashboard view. Also display a pending invitation banner if the user has received invitations, and a prompt to invite a partner if no partnership exists.

## Context
All the components needed for this page already exist: DashboardCards, CategoryPieChart, MonthlyTrendChart (Task 07), PendingInvitations (Task 05), and the useDashboardData hook (Task 07). The layout is in place (Task 04). This task wires everything together into the page.

UI text in Portuguese. Code in English.

## Requirements
- Month/year selector at the top of the page (default: current month)
- Four summary cards in a responsive grid
- Category pie chart and monthly trend chart side by side on desktop, stacked on mobile
- Pending invitations banner at the top (if any)
- "Connect with your partner" prompt if no active partnership
- Loading skeletons while data is fetching
- Page title: "Painel"

## Existing Code References
- `src/components/dashboard/DashboardCards.tsx` (Task 07)
- `src/components/dashboard/CategoryPieChart.tsx` (Task 07)
- `src/components/dashboard/MonthlyTrendChart.tsx` (Task 07)
- `src/hooks/useDashboardData.ts` (Task 07)
- `src/components/partnership/PendingInvitations.tsx` (Task 05)
- `src/hooks/usePartnership.ts` (Task 05)
- `src/hooks/useInvitations.ts` (Task 05)
- `src/components/ui/` -- Card, Select, Skeleton

## Files to Create/Modify

```
src/pages/DashboardPage.tsx    # Main dashboard page
```

## Implementation Details

### Page Structure
```tsx
export function DashboardPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const { monthSummary, trendData, isLoading } = useDashboardData(month, year)
  const { isLinked } = usePartnership()
  const { received } = useInvitations()

  return (
    <div className="space-y-6">
      {/* Page header with month selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel</h1>
        <MonthYearSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
      </div>

      {/* Pending invitations banner */}
      {received.length > 0 && <PendingInvitations invitations={received} />}

      {/* Partner prompt if not linked */}
      {!isLinked && received.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 py-4">
            <Users className="h-8 w-8 text-muted-foreground" />
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
            {isLoading ? <Skeleton className="h-[300px]" /> : <CategoryPieChart data={monthSummary.byCategory} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolucao Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px]" /> : <MonthlyTrendChart data={trendData} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### MonthYearSelector
A small inline component (can be defined in the same file or extracted):
- Two shadcn Select dropdowns: one for month (Janeiro-Dezembro), one for year (current year and previous year)
- Calls `onChange(month, year)` when either changes

Month options in Portuguese:
```ts
const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]
```

### Loading Skeletons
While `isLoading`:
- Show 4 Skeleton cards in the grid for DashboardCards
- Show Skeleton blocks (300px height) inside chart Cards

### Responsive Layout
- Summary cards: `grid grid-cols-2 md:grid-cols-4 gap-4`
- Charts: `grid md:grid-cols-2 gap-6` (side by side on desktop, stacked on mobile)

## Acceptance Criteria
- [ ] Dashboard page renders with all four summary cards
- [ ] Pie chart shows category breakdown for the selected month
- [ ] Line chart shows 6-month trend
- [ ] Month/year selector updates all data when changed
- [ ] Pending invitations appear as a banner at the top
- [ ] If no partnership, a prompt to connect is shown
- [ ] Loading skeletons display while data is fetching
- [ ] Layout is responsive (cards and charts adapt to screen size)
- [ ] All text is in Portuguese

## Dependencies
- Depends on: Task 04 (layout), Task 05 (partnership/invitations), Task 07 (charts and dashboard data)
- Blocks: None (this is a leaf task)
