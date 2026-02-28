import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useInvitations() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  // Received invitations (where invitee_email matches my email)
  const receivedQuery = useQuery({
    queryKey: ['invitations', 'received', profile?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*, inviter:profiles!invitations_inviter_id_fkey(*)')
        .eq('invitee_email', profile!.email)
        .eq('status', 'pending')
      if (error) throw error
      return data
    },
    enabled: !!profile,
  })

  // Sent invitations
  const sentQuery = useQuery({
    queryKey: ['invitations', 'sent', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('inviter_id', user!.id)
        .eq('status', 'pending')
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // Send invitation mutation
  const sendInvitation = useMutation({
    mutationFn: async (inviteeEmail: string) => {
      if (inviteeEmail === profile?.email) {
        throw new Error('Voce nao pode se convidar.')
      }

      const { data: existing } = await supabase
        .from('partnerships')
        .select('id')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .eq('status', 'active')
        .maybeSingle()

      if (existing) throw new Error('Voce ja possui um vinculo ativo.')

      const { data, error } = await supabase
        .from('invitations')
        .insert({ inviter_id: user!.id, invitee_email: inviteeEmail })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Convite enviado com sucesso!')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Erro ao enviar convite.')
    },
  })

  // Accept invitation mutation
  const acceptInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data: invitation, error: fetchErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single()
      if (fetchErr || !invitation) throw new Error('Convite nao encontrado.')

      const { error: updateErr } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
      if (updateErr) throw updateErr

      const { error: partErr } = await supabase
        .from('partnerships')
        .insert({ user1_id: invitation.inviter_id, user2_id: user!.id, status: 'active' })
      if (partErr) throw partErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      queryClient.invalidateQueries({ queryKey: ['partnership'] })
      toast.success('Vinculo criado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao aceitar convite.')
    },
  })

  // Cancel sent invitation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Convite cancelado.')
    },
    onError: () => {
      toast.error('Erro ao cancelar convite.')
    },
  })

  // Decline received invitation
  const declineInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Convite recusado.')
    },
    onError: () => {
      toast.error('Erro ao recusar convite.')
    },
  })

  return {
    received: receivedQuery.data ?? [],
    sent: sentQuery.data ?? [],
    sendInvitation,
    acceptInvitation,
    cancelInvitation,
    declineInvitation,
    isLoadingReceived: receivedQuery.isLoading,
    isLoadingSent: sentQuery.isLoading,
  }
}
