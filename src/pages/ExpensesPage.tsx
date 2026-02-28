import { useState, useMemo } from 'react'
import { Plus, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { DeleteExpenseDialog } from '@/components/expenses/DeleteExpenseDialog'
import { CsvImportDialog } from '@/components/expenses/CsvImportDialog'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { exportExpensesToCsv } from '@/lib/csv'
import type { Expense, Category, ExpenseInsert } from '@/types/database'

export function ExpensesPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [view, setView] = useState<'mine' | 'shared' | 'all'>('mine')
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<(Expense & { category: Category }) | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const queryClient = useQueryClient()

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

  const handleExport = () => {
    if (expenses.length === 0) {
      toast.info('Nenhuma despesa para exportar.')
      return
    }
    const filename = `cojunta-despesas-${year}-${String(month).padStart(2, '0')}.csv`
    exportExpensesToCsv(expenses as (Expense & { category: Category })[], filename)
    toast.success('Exportacao concluida!')
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
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

      {/* CSV Import dialog */}
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        }}
      />
    </div>
  )
}
