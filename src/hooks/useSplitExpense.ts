import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function useSplitExpense() {
  const queryClient = useQueryClient()

  const splitExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { data, error } = await supabase.rpc('split_expense', {
        p_expense_id: expenseId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Despesa dividida com sucesso!')
    },
    onError: (error: Error) => {
      // The DB function raises exceptions with Portuguese messages
      // Supabase returns them in error.message
      toast.error(error.message || 'Erro ao dividir despesa.')
    },
  })

  const unsplitExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { data, error } = await supabase.rpc('unsplit_expense', {
        p_expense_id: expenseId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Divisao desfeita com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao desfazer divisao.')
    },
  })

  return {
    splitExpense,
    unsplitExpense,
  }
}
