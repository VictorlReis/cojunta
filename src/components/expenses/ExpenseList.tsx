import { Skeleton } from '@/components/ui/skeleton'
import { ExpenseItem } from './ExpenseItem'
import { PackageOpen } from 'lucide-react'
import type { Expense, Category } from '@/types/database'

interface ExpenseListProps {
  expenses: (Expense & { category: Category })[]
  isLoading: boolean
  currentUserId: string
  onEdit: (expense: Expense & { category: Category }) => void
  onDelete: (id: string) => void
  onSplit: (expense: Expense & { category: Category }) => void
  onUnsplit: (expense: Expense & { category: Category }) => void
  unsplittingExpenseId?: string | null
  halveSharedAmounts?: boolean
  partnerName: string | null
  isLinked: boolean
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4 gap-4">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-3 w-3 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  )
}

export function ExpenseList({ expenses, isLoading, currentUserId, onEdit, onDelete, onSplit, onUnsplit, unsplittingExpenseId, halveSharedAmounts, partnerName, isLinked }: ExpenseListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <PackageOpen className="h-12 w-12 opacity-30" />
        <p className="text-sm">Nenhuma despesa encontrada para este periodo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          onSplit={onSplit}
          onUnsplit={onUnsplit}
          isOwn={expense.user_id === currentUserId}
          isUnsplitting={unsplittingExpenseId === expense.id}
          halveSharedAmounts={halveSharedAmounts}
          partnerName={partnerName}
          isLinked={isLinked}
        />
      ))}
    </div>
  )
}
