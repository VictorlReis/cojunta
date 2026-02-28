# Task 05: Partnership and Invitation System -- Send, Receive, Accept Invitations

## Objective
Implement the partner invitation flow: a user can send an invitation by entering their partner's email, the invited user sees pending invitations upon login, they can accept to create an active partnership, and both users see each other's partnership status throughout the app.

## Context
The database tables `invitations` and `partnerships` with their RLS policies exist (Task 02). Authentication and profile loading are in place (Task 03). The app layout exists (Task 04). This task implements the full invitation lifecycle -- it is a core differentiator of the app since the couple link enables shared expense visibility.

UI text in Portuguese. Code in English.

## Requirements
- `usePartnership` hook that queries the current user's active partnership and partner profile
- `useInvitations` hook that queries pending invitations (sent and received)
- "Enviar Convite" form: input for partner's email + send button
- Display of pending sent invitations with ability to cancel
- Banner/card showing pending received invitations with "Aceitar" and "Recusar" buttons
- On acceptance: create partnership record, update invitation status
- Display partner info when partnership is active (name, email)
- Ability to dissolve partnership (optional but good for completeness)
- All mutations use TanStack Query with proper cache invalidation

## Existing Code References
- `src/types/database.ts` -- Partnership, Invitation, Profile types (Task 02)
- `src/lib/supabase.ts` -- Supabase client
- `src/hooks/useAuth.ts` -- current user/profile info
- `src/components/ui/` -- Card, Button, Input, Dialog, Badge, Sonner/toast

## Files to Create

```
src/hooks/usePartnership.ts                  # Partnership query hook
src/hooks/useInvitations.ts                  # Invitations query + mutation hooks
src/components/partnership/InvitePartnerDialog.tsx  # Dialog to send invite
src/components/partnership/PendingInvitations.tsx   # Show received invitations
src/components/partnership/SentInvitations.tsx      # Show sent invitations
src/components/partnership/PartnerCard.tsx           # Display active partner info
```

## Implementation Details

### 1. `usePartnership` Hook
```ts
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

  // Derive partner profile from partnership
  const partner = partnershipQuery.data
    ? (partnershipQuery.data.user1_id === user?.id
        ? partnershipQuery.data.user2
        : partnershipQuery.data.user1) as Profile
    : null

  return {
    partnership: partnershipQuery.data,
    partner,
    isLinked: !!partnershipQuery.data,
    isLoading: partnershipQuery.isLoading,
  }
}
```

### 2. `useInvitations` Hook
```ts
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
      // Validate: cannot invite self
      if (inviteeEmail === profile?.email) throw new Error('Voce nao pode se convidar.')
      // Check if already has active partnership
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
  })

  // Accept invitation mutation
  const acceptInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      // Get the invitation to find the inviter
      const { data: invitation, error: fetchErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single()
      if (fetchErr || !invitation) throw new Error('Convite nao encontrado.')

      // Update invitation status
      const { error: updateErr } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
      if (updateErr) throw updateErr

      // Create partnership
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
  })

  return {
    received: receivedQuery.data ?? [],
    sent: sentQuery.data ?? [],
    sendInvitation,
    acceptInvitation,
    cancelInvitation,
    isLoadingReceived: receivedQuery.isLoading,
    isLoadingSent: sentQuery.isLoading,
  }
}
```

### 3. InvitePartnerDialog
- Opens via a Button labeled "Convidar Parceiro(a)"
- Dialog with email input and "Enviar Convite" button
- Shows validation error if email is invalid or same as own
- Shows success toast on send
- Closes dialog on success

### 4. PendingInvitations
- Shown prominently (e.g., a top banner on the dashboard or settings page)
- For each received pending invitation: show inviter's display_name, email, and "Aceitar" / "Recusar" buttons
- Use a Card component with a highlight border

### 5. SentInvitations
- List of pending sent invitations
- Each shows invitee_email, status badge, and "Cancelar" button
- Shown in the settings page partnership section

### 6. PartnerCard
- When partnership is active, show partner's display_name and email
- A small Card component with a user icon
- Optionally show a "Desfazer Vinculo" button (sets partnership status to 'dissolved')

## Acceptance Criteria
- [ ] User can send an invitation by entering a partner's email
- [ ] Validation prevents inviting self or inviting when already in a partnership
- [ ] Invited user sees pending invitations when logged in
- [ ] Accepting an invitation creates an active partnership for both users
- [ ] Cancelling a sent invitation updates its status
- [ ] Active partnership displays partner's name and email
- [ ] All mutations properly invalidate relevant TanStack Query caches
- [ ] Toast notifications appear for success/error states in Portuguese

## Dependencies
- Depends on: Task 01 (project setup), Task 02 (schema), Task 03 (auth), Task 04 (layout)
- Blocks: Task 06 (expenses -- needs partnership_id for shared expenses)
