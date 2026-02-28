import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Category } from '@/types/database'

export function useCategories() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Category[]
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createCategory = useMutation({
    mutationFn: async (input: { name: string; icon?: string; color?: string }) => {
      if (!user?.id) throw new Error('Usuario nao autenticado.')
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: input.name,
          icon: input.icon ?? 'circle',
          color: input.color ?? '#8B5CF6',
          partnership_id: null,
          created_by: user.id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria criada com sucesso!')
    },
    onError: (error: { code?: string }) => {
      if (error?.code === '23505') {
        toast.error('Ja existe uma categoria com esse nome.')
      } else {
        toast.error('Erro ao criar categoria.')
      }
    },
  })

  const updateCategory = useMutation({
    mutationFn: async (input: { id: string; name?: string; icon?: string; color?: string }) => {
      const { id, ...fields } = input
      const { data, error } = await supabase
        .from('categories')
        .update(fields)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria atualizada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar categoria.')
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // 1. Get the fallback category ID
      const { data: fallback, error: fallbackError } = await supabase
        .from('categories')
        .select('id')
        .is('partnership_id', null)
        .eq('name', 'Sem Categoria')
        .single()
      if (fallbackError || !fallback) throw new Error('Categoria padrao nao encontrada.')

      // 2. Reassign expenses
      const { error: reassignError } = await supabase
        .from('expenses')
        .update({ category_id: fallback.id })
        .eq('category_id', id)
      if (reassignError) throw reassignError

      // 3. Delete category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Categoria excluida. Despesas movidas para "Sem Categoria".')
    },
    onError: () => {
      toast.error('Erro ao excluir categoria.')
    },
  })

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
