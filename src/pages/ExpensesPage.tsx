import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { DeleteExpenseDialog } from '@/components/expenses/DeleteExpenseDialog'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import type { Expense, Category, ExpenseInsert } from '@/types/database'

export function ExpensesPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [view, setView] = useState<'mine' | 'shared' | 'all'>('mine')
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<(Expense & { category: Category }) | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses({
    month,
    year,
    view,
  })
  const { user } = useAuth()

  const total = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses])

  const handleOpenCreate = () => {
    setEditingExpense(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (expense: Expense & { category: Category }) => {
    setEditingExpense(expense)
    setFormOpen(true)
  }

  const handleSubmit = async (data: Omit<ExpenseInsert, 'user_id'>) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, ...data })
    } else {
      await createExpense.mutateAsync(data)
    }
    setFormOpen(false)
    setEditingExpense(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Filters */}
      <ExpenseFilters
        month={month}
        year={year}
        view={view}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onViewChange={setView}
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
        expenses={expenses as (Expense & { category: Category })[]}
        isLoading={isLoading}
        currentUserId={user?.id ?? ''}
        onEdit={handleOpenEdit}
        onDelete={(id) => setDeletingExpenseId(id)}
      />

      {/* Create/Edit dialog */}
      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editingExpense}
        onSubmit={handleSubmit}
        isSubmitting={createExpense.isPending || updateExpense.isPending}
      />

      {/* Delete confirmation */}
      <DeleteExpenseDialog
        open={!!deletingExpenseId}
        onOpenChange={(open) => {
          if (!open) setDeletingExpenseId(null)
        }}
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
