import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Expense, Category } from '@/types/database'

interface ExpenseItemProps {
  expense: Expense & { category: Category }
  onEdit: (expense: Expense & { category: Category }) => void
  onDelete: (id: string) => void
  isOwn: boolean
}

export function ExpenseItem({ expense, onEdit, onDelete, isOwn }: ExpenseItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Category color dot */}
        <div
          className="flex-shrink-0 h-3 w-3 rounded-full"
          style={{ backgroundColor: expense.category?.color ?? '#8B5CF6' }}
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">
              {expense.description || expense.category?.name}
            </span>
            {expense.is_shared && (
              <Badge variant="secondary" className="text-xs">
                Compartilhado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{expense.category?.name}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatDate(expense.expense_date)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-semibold">{formatCurrency(expense.amount)}</span>

        {isOwn && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onEdit(expense)}
              aria-label="Editar despesa"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(expense.id)}
              aria-label="Excluir despesa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
