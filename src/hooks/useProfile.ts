import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'

export function useProfile() {
  const { user } = useAuth()
  const { setProfile } = useAuthStore()
  const queryClient = useQueryClient()

  const updateProfile = useMutation({
    mutationFn: async (updates: { display_name: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setProfile(data)
      queryClient.invalidateQueries({ queryKey: ['partnership'] })
      toast.success('Perfil atualizado!')
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil.')
    },
  })

  return { updateProfile }
}
