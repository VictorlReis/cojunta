# Task 06: Expense CRUD -- Hooks, Form, and Data Layer

## Objective
Implement the complete expense data layer: a TanStack Query hook for querying expenses (with filters for month, category, shared/individual), mutations for create/update/delete, and the expense form component (used in both create and edit modes).

## Context
The `expenses` table with RLS policies exists (Task 02). Auth is available (Task 03). Categories are seeded and queryable (Task 02). The partnership hook provides the `partnership_id` needed for shared expenses (Task 05). This task builds the data layer and form UI but NOT the full page -- the ExpensesPage is Task 09.

UI text in Portuguese. Code in English.

## Requirements
- `useExpenses` hook with month/year filtering, shared/individual toggle, and pagination-ready structure
- `useCategories` hook to fetch predefined categories
- Create expense mutation with optimistic updates
- Update expense mutation
- Delete expense mutation with confirmation
- `ExpenseForm` component for create and edit (dialog-based)
- `ExpenseItem` component for displaying a single expense row
- Proper TypeScript typing throughout

## Existing Code References
- `src/types/database.ts` -- Expense, ExpenseInsert, ExpenseUpdate, Category types (Task 02)
- `src/lib/supabase.ts` -- Supabase client
- `src/lib/utils.ts` -- formatCurrency, formatDate
- `src/hooks/useAuth.ts` -- current user
- `src/hooks/usePartnership.ts` -- partnership info (Task 05)
- `src/components/ui/` -- Dialog, Button, Input, Select, Label, Badge, Card

## Files to Create

```
src/hooks/useExpenses.ts                  # Expense queries and mutations
src/hooks/useCategories.ts                # Categories query
src/components/expenses/ExpenseForm.tsx   # Create/edit expense form dialog
src/components/expenses/ExpenseItem.tsx   # Single expense display row
src/components/expenses/ExpenseFilters.tsx # Month/year selector + view toggle
```

## Implementation Details

### 1. `useCategories` Hook
```ts
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Category[]
    },
    staleTime: Infinity, // Categories are static in Phase 1
  })
}
```

### 2. `useExpenses` Hook
```ts
interface UseExpensesOptions {
  month: number    // 1-12
  year: number
  view: 'mine' | 'shared' | 'all'   // filter mode
}

export function useExpenses({ month, year, view }: UseExpensesOptions) {
  const { user } = useAuth()
  const { partnership } = usePartnership()
  const queryClient = useQueryClient()

  // Build date range for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = lastDayOfMonth(year, month) // helper function

  const expensesQuery = useQuery({
    queryKey: ['expenses', user?.id, month, year, view],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false })

      if (view === 'mine') {
        query = query.eq('user_id', user!.id)
      } else if (view === 'shared') {
        query = query.eq('is_shared', true)
        // RLS will filter to only own + partner's shared expenses
      }
      // 'all' -- no extra filter, RLS handles visibility

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // Create expense
  const createExpense = useMutation({
    mutationFn: async (expense: Omit<ExpenseInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          user_id: user!.id,
          partnership_id: expense.is_shared ? partnership?.id ?? null : null,
        })
        .select('*, category:categories(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Despesa adicionada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao adicionar despesa.')
    },
  })

  // Update expense
  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: ExpenseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Despesa atualizada!')
    },
    onError: () => {
      toast.error('Erro ao atualizar despesa.')
    },
  })

  // Delete expense
  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Despesa excluida!')
    },
    onError: () => {
      toast.error('Erro ao excluir despesa.')
    },
  })

  return {
    expenses: expensesQuery.data ?? [],
    isLoading: expensesQuery.isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}

// Helper
function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0)
  return d.toISOString().split('T')[0]
}
```

### 3. ExpenseForm Component
A dialog-based form used for both creating and editing:

**Props:**
```ts
interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null   // If provided, edit mode
  onSubmit: (data: ExpenseFormData) => void
  isSubmitting: boolean
}
```

**Form fields:**
- Description (text Input)
- Amount (numeric Input, formatted as currency on blur)
- Category (Select dropdown populated from `useCategories`)
- Date (Input type="date", defaults to today)
- Shared toggle (Checkbox or Switch labeled "Compartilhar com parceiro(a)")

**Validation:**
- Amount must be > 0
- Category is required
- Description is optional but encouraged (placeholder text)
- Date is required

**Labels in Portuguese:**
- "Descricao", "Valor (R$)", "Categoria", "Data", "Compartilhar com parceiro(a)"
- Submit button: "Adicionar Despesa" (create) or "Salvar Alteracoes" (edit)

### 4. ExpenseItem Component
Displays a single expense as a row/card:
```tsx
interface ExpenseItemProps {
  expense: Expense & { category: Category }
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  isOwn: boolean  // whether current user owns this expense
}
```

Shows:
- Category color dot/icon + category name
- Description
- Formatted date
- Formatted amount (R$ X.XXX,XX)
- "Compartilhado" badge if `is_shared`
- Edit/Delete buttons (only visible if `isOwn`)

### 5. ExpenseFilters Component
- Month/Year selector (two Select dropdowns or a combined picker)
- View toggle: "Meus" | "Compartilhados" | "Todos" (using shadcn Tabs or Button group)
- Emits filter changes to parent

## Acceptance Criteria
- [ ] `useCategories` returns all 10 predefined categories
- [ ] `useExpenses` returns expenses filtered by month/year and view mode
- [ ] Creating an expense via the form adds it to the database and updates the list
- [ ] Editing an expense updates it in the database
- [ ] Deleting an expense removes it with proper cache invalidation
- [ ] Shared expenses include the `partnership_id`
- [ ] Form validates required fields and shows errors in Portuguese
- [ ] All toast messages are in Portuguese
- [ ] TypeScript types are used throughout with no `any`

## Dependencies
- Depends on: Task 01 (project setup), Task 02 (schema), Task 03 (auth), Task 05 (partnership hook)
- Blocks: Task 08 (dashboard -- uses expense data for charts), Task 09 (expenses page)
