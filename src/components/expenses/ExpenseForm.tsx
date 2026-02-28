import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { usePartnership } from '@/hooks/usePartnership'
import type { Expense, ExpenseInsert } from '@/types/database'

export interface ExpenseFormData {
  description: string
  amount: number
  category_id: string
  expense_date: string
  is_shared: boolean
}

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  onSubmit: (data: Omit<ExpenseInsert, 'user_id'>) => Promise<void>
  isSubmitting: boolean
}

function toInputDate(dateStr: string): string {
  // Ensure date is in YYYY-MM-DD format
  return dateStr.split('T')[0]
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function ExpenseForm({ open, onOpenChange, expense, onSubmit, isSubmitting }: ExpenseFormProps) {
  const { categories } = useCategories()
  const { isLinked } = usePartnership()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayDate())
  const [isShared, setIsShared] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({})

  // Populate form when editing
  useEffect(() => {
    if (expense) {
      setDescription(expense.description)
      setAmount(String(expense.amount))
      setCategoryId(expense.category_id)
      setDate(toInputDate(expense.expense_date))
      setIsShared(expense.is_shared)
    } else {
      setDescription('')
      setAmount('')
      setCategoryId('')
      setDate(todayDate())
      setIsShared(false)
    }
    setErrors({})
  }, [expense, open])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {}
    const amountNum = parseFloat(amount)

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Informe um valor valido maior que zero.'
    }
    if (!categoryId) {
      newErrors.category_id = 'Selecione uma categoria.'
    }
    if (!date) {
      newErrors.expense_date = 'Informe a data da despesa.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      category_id: categoryId,
      expense_date: date,
      is_shared: isShared,
    })
  }

  const isEdit = !!expense

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Input
              id="description"
              placeholder="Ex: Supermercado, conta de luz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="expenseDate">Data</Label>
            <Input
              id="expenseDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.expense_date && <p className="text-sm text-destructive">{errors.expense_date}</p>}
          </div>

          {/* Shared toggle - only show if user has a partner */}
          {isLinked && (
            <div className="flex items-center gap-3">
              <input
                id="isShared"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
              />
              <Label htmlFor="isShared" className="cursor-pointer font-normal">
                Compartilhar com parceiro(a)
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : isEdit
                  ? 'Salvar Alteracoes'
                  : 'Adicionar Despesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
