# Task 07: Dashboard Charts -- Category Pie Chart and Monthly Trend Line Chart

## Objective
Build the two Recharts chart components for the dashboard: a pie chart showing expense breakdown by category for the current month, and a line chart showing monthly spending trends over the last 6 months with separate lines for individual and shared expenses.

## Context
Recharts is installed (Task 01). Expense data is queryable via `useExpenses` (Task 06). Categories with colors are available via `useCategories` (Task 06). These chart components will be used inside the DashboardPage (Task 08). This task focuses only on the chart components and the data-fetching hooks they need.

UI text in Portuguese. Code in English.

## Requirements
- `CategoryPieChart` component: pie chart with category colors, labels, and amounts
- `MonthlyTrendChart` component: line chart with 6 months of data, two lines (individual + shared)
- `useDashboardData` hook that aggregates expense data for the charts
- Responsive sizing (charts fill their container)
- Proper formatting of currency values in tooltips and labels (R$ format)
- Empty state display when no data exists

## Existing Code References
- `src/hooks/useExpenses.ts` -- expense querying (Task 06)
- `src/hooks/useCategories.ts` -- categories with colors (Task 06)
- `src/lib/utils.ts` -- formatCurrency
- `src/types/database.ts` -- Expense, Category types

## Files to Create

```
src/hooks/useDashboardData.ts                    # Aggregation queries for dashboard
src/components/dashboard/CategoryPieChart.tsx     # Recharts PieChart
src/components/dashboard/MonthlyTrendChart.tsx    # Recharts LineChart
src/components/dashboard/DashboardCards.tsx       # Summary stat cards
```

## Implementation Details

### 1. `useDashboardData` Hook
This hook performs two queries:

**Current month summary (for pie chart and cards):**
```ts
interface CategorySummary {
  categoryId: string
  categoryName: string
  categoryColor: string
  total: number
}

interface MonthSummary {
  totalExpenses: number
  myExpenses: number
  sharedExpenses: number
  partnerExpenses: number
  byCategory: CategorySummary[]
}
```

Query all expenses for the selected month (same as `useExpenses` but aggregate client-side):
```ts
const monthExpenses = useQuery({
  queryKey: ['dashboard', 'month', user?.id, month, year],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:categories(*)')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
    if (error) throw error
    return data
  },
  enabled: !!user,
})
```

Then aggregate in a `useMemo`:
- Group by category, summing amounts
- Calculate totals: myExpenses (user_id === me), sharedExpenses (is_shared), partnerExpenses (user_id !== me && is_shared)

**6-month trend (for line chart):**
```ts
interface MonthlyTrend {
  month: string       // "Jan", "Fev", "Mar", etc.
  individual: number
  shared: number
  total: number
}
```

Query expenses for the last 6 months:
```ts
const trendExpenses = useQuery({
  queryKey: ['dashboard', 'trend', user?.id],
  queryFn: async () => {
    const sixMonthsAgo = subMonths(new Date(), 5) // start of 6 months ago
    const startDate = format(sixMonthsAgo, 'yyyy-MM-01')
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, expense_date, is_shared, user_id')
      .gte('expense_date', startDate)
    if (error) throw error
    return data
  },
  enabled: !!user,
})
```

Aggregate in `useMemo` by month, splitting individual vs shared.

Use Portuguese month abbreviations: "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez".

**Date helpers**: Implement simple helper functions (or install `date-fns` if not already present). Prefer implementing manually to avoid an extra dependency:
```ts
function subMonths(date: Date, months: number): Date { ... }
function getMonthAbbr(month: number): string {
  const abbrs = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return abbrs[month]
}
```

### 2. CategoryPieChart
```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface CategoryPieChartProps {
  data: CategorySummary[]
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <EmptyState message="Nenhuma despesa neste mes." />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoryName"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ categoryName, total }) => `${categoryName}: ${formatCurrency(total)}`}
        >
          {data.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.categoryColor} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

### 3. MonthlyTrendChart
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyTrendChartProps {
  data: MonthlyTrend[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length === 0) {
    return <EmptyState message="Sem dados para exibir." />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `R$ ${value}`} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Line type="monotone" dataKey="individual" name="Individual" stroke="#36A2EB" strokeWidth={2} />
        <Line type="monotone" dataKey="shared" name="Compartilhado" stroke="#FF6384" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### 4. DashboardCards
Four summary cards using shadcn Card:
- "Total do Mes" -- total of all visible expenses
- "Meus Gastos" -- sum of user's own expenses
- "Compartilhados" -- sum of shared expenses
- "Parceiro(a)" -- sum of partner's shared expenses visible to user

Each card:
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{formatCurrency(value)}</div>
  </CardContent>
</Card>
```

## Acceptance Criteria
- [ ] Pie chart renders with correct category colors from the database
- [ ] Pie chart tooltips show formatted BRL currency values
- [ ] Line chart shows 6 months of data with two lines (individual + shared)
- [ ] Line chart axes and tooltips use Portuguese month names and BRL formatting
- [ ] Dashboard cards show correct totals for the selected month
- [ ] Empty states show a Portuguese message when no data exists
- [ ] Charts are responsive and resize with their container
- [ ] All components are properly typed with TypeScript

## Dependencies
- Depends on: Task 01 (Recharts installed), Task 02 (schema), Task 06 (expense/category hooks)
- Blocks: Task 08 (dashboard page -- assembles these components)
