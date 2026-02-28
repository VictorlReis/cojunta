import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePartnership } from '@/hooks/usePartnership'
import type { ExpenseInsert, ExpenseUpdate } from '@/types/database'

interface UseExpensesOptions {
  month: number // 1-12
  year: number
  view: 'mine' | 'shared' | 'all'
}

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0)
  return d.toISOString().split('T')[0]
}

export function useExpenses({ month, year, view }: UseExpensesOptions) {
  const { user } = useAuth()
  const { partnership } = usePartnership()
  const queryClient = useQueryClient()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = lastDayOfMonth(year, month)

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
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<ExpenseInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          user_id: user!.id,
          partnership_id: expense.is_shared ? (partnership?.id ?? null) : null,
        })
        .select('*, category:categories(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Despesa adicionada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao adicionar despesa.')
    },
  })

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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Despesa atualizada!')
    },
    onError: () => {
      toast.error('Erro ao atualizar despesa.')
    },
  })

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
