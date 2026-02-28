import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types/database'

export function usePartnership() {
  const { user } = useAuth()

  const partnershipQuery = useQuery({
    queryKey: ['partnership', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partnerships')
        .select('*, user1:profiles!partnerships_user1_id_fkey(*), user2:profiles!partnerships_user2_id_fkey(*)')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .eq('status', 'active')
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const rawPartnership = partnershipQuery.data as
    | (typeof partnershipQuery.data & { user1: Profile; user2: Profile })
    | null

  const partner = rawPartnership
    ? rawPartnership.user1_id === user?.id
      ? rawPartnership.user2
      : rawPartnership.user1
    : null

  return {
    partnership: partnershipQuery.data ?? null,
    partner,
    isLinked: !!partnershipQuery.data,
    isLoading: partnershipQuery.isLoading,
  }
}
