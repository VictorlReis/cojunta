# Task 09: Expenses Page -- List View, Filters, and Full CRUD Integration

## Objective
Build the ExpensesPage that displays the expense list with monthly filtering, view toggle (mine/shared/all), the total summary bar, and integrates the expense form for create/edit/delete operations.

## Context
All the expense components and hooks exist: useExpenses, useCategories (Task 06), ExpenseForm, ExpenseItem, ExpenseFilters (Task 06). The layout with navigation is in place (Task 04). This task assembles everything into the full expenses page.

UI text in Portuguese. Code in English.

## Requirements
- Month/year filter at the top
- View toggle: "Meus Gastos", "Compartilhados", "Todos"
- Total summary bar showing the sum for the current filter
- Expense list showing all expenses matching current filters
- Floating action button or prominent "Adicionar Despesa" button to open the create form
- Click on an expense to open edit form
- Delete with confirmation dialog
- Empty state when no expenses match the filter
- Loading skeletons while data loads

## Existing Code References
- `src/hooks/useExpenses.ts` (Task 06)
- `src/hooks/useCategories.ts` (Task 06)
- `src/components/expenses/ExpenseForm.tsx` (Task 06)
- `src/components/expenses/ExpenseItem.tsx` (Task 06)
- `src/components/expenses/ExpenseFilters.tsx` (Task 06)
- `src/lib/utils.ts` -- formatCurrency
- `src/components/ui/` -- Button, Dialog, Card, Skeleton, Tabs, Badge

## Files to Create/Modify

```
src/pages/ExpensesPage.tsx                      # Main expenses page
src/components/expenses/ExpenseList.tsx          # List container component
src/components/expenses/DeleteExpenseDialog.tsx  # Confirmation dialog for delete
```

## Implementation Details

### Page Structure
```tsx
export function ExpensesPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [view, setView] = useState<'mine' | 'shared' | 'all'>('mine')
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses({ month, year, view })
  const { user } = useAuth()

  const total = useMemo(() =>
    expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <Button onClick={() => { setEditingExpense(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      {/* Filters */}
      <ExpenseFilters
        month={month} year={year} view={view}
        onMonthChange={setMonth} onYearChange={setYear} onViewChange={setView}
      />

      {/* Summary bar */}
      <div className="rounded-lg bg-muted p-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Total ({expenses.length} {expenses.length === 1 ? 'despesa' : 'despesas'})
        </span>
        <span className="text-lg font-bold">{formatCurrency(total)}</span>
      </div>

      {/* Expense list */}
      <ExpenseList
        expenses={expenses}
        isLoading={isLoading}
        currentUserId={user?.id ?? ''}
        onEdit={(expense) => { setEditingExpense(expense); setFormOpen(true) }}
        onDelete={(id) => setDeletingExpenseId(id)}
      />

      {/* Create/Edit dialog */}
      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editingExpense}
        onSubmit={async (data) => {
          if (editingExpense) {
            await updateExpense.mutateAsync({ id: editingExpense.id, ...data })
          } else {
            await createExpense.mutateAsync(data)
          }
          setFormOpen(false)
          setEditingExpense(null)
        }}
        isSubmitting={createExpense.isPending || updateExpense.isPending}
      />

      {/* Delete confirmation */}
      <DeleteExpenseDialog
        open={!!deletingExpenseId}
        onOpenChange={(open) => { if (!open) setDeletingExpenseId(null) }}
        onConfirm={async () => {
          if (deletingExpenseId) {
            await deleteExpense.mutateAsync(deletingExpenseId)
            setDeletingExpenseId(null)
          }
        }}
        isDeleting={deleteExpense.isPending}
      />
    </div>
  )
}
```

### ExpenseList Component
```tsx
interface ExpenseListProps {
  expenses: (Expense & { category: Category })[]
  isLoading: boolean
  currentUserId: string
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}
```

- If `isLoading`, show 5 Skeleton rows
- If expenses is empty, show an empty state: illustration or icon + "Nenhuma despesa encontrada para este periodo."
- Otherwise, render a list of `ExpenseItem` components
- Group expenses by date (optional enhancement -- show date headers)

### DeleteExpenseDialog
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Excluir Despesa</DialogTitle>
      <DialogDescription>
        Tem certeza que deseja excluir esta despesa? Esta acao nao pode ser desfeita.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
      <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
        {isDeleting ? 'Excluindo...' : 'Excluir'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### View Toggle using Tabs
Inside `ExpenseFilters`, the view toggle should use shadcn Tabs:
```tsx
<Tabs value={view} onValueChange={onViewChange}>
  <TabsList>
    <TabsTrigger value="mine">Meus Gastos</TabsTrigger>
    <TabsTrigger value="shared">Compartilhados</TabsTrigger>
    <TabsTrigger value="all">Todos</TabsTrigger>
  </TabsList>
</Tabs>
```

## Acceptance Criteria
- [ ] Expenses page shows a filterable list of expenses
- [ ] Month/year selector filters the expense list
- [ ] View toggle switches between mine/shared/all views
- [ ] Total summary bar shows correct sum and expense count
- [ ] "Adicionar" button opens the create form
- [ ] Clicking an expense opens the edit form (only for own expenses)
- [ ] Delete button shows confirmation dialog before deleting
- [ ] Empty state displays when no expenses match filters
- [ ] Loading skeletons show while data is fetching
- [ ] All text is in Portuguese

## Dependencies
- Depends on: Task 04 (layout), Task 06 (expense CRUD components and hooks)
- Blocks: None (leaf task)
