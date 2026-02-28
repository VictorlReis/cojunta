# Task 10: Settings Page -- Profile, Partnership Management, and Account Settings

## Objective
Build the SettingsPage that allows users to view/edit their profile (display name), manage their partnership (send invitations, view partner, dissolve partnership), and access account actions (logout).

## Context
The partnership and invitation components exist (Task 05): InvitePartnerDialog, SentInvitations, PendingInvitations, PartnerCard. Auth with profile management exists (Task 03). The layout is in place (Task 04). This task assembles these into the settings page and adds profile editing.

UI text in Portuguese. Code in English.

## Requirements
- Profile section: display name (editable), email (read-only)
- Partnership section: shows current partner OR invitation controls
- Sent invitations list (if any pending)
- Received invitations (if any pending)
- Profile update saves to Supabase `profiles` table
- Logout button
- Sections organized in Cards for visual clarity

## Existing Code References
- `src/hooks/useAuth.ts` -- profile data, signOut (Task 03)
- `src/hooks/usePartnership.ts` (Task 05)
- `src/hooks/useInvitations.ts` (Task 05)
- `src/components/partnership/InvitePartnerDialog.tsx` (Task 05)
- `src/components/partnership/SentInvitations.tsx` (Task 05)
- `src/components/partnership/PendingInvitations.tsx` (Task 05)
- `src/components/partnership/PartnerCard.tsx` (Task 05)
- `src/stores/authStore.ts` -- for updating profile in store
- `src/components/ui/` -- Card, Button, Input, Label, Separator

## Files to Create

```
src/pages/SettingsPage.tsx        # Main settings page
src/hooks/useProfile.ts           # Profile update mutation
```

## Implementation Details

### 1. `useProfile` Hook
```ts
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
```

### 2. SettingsPage
```tsx
export function SettingsPage() {
  const { profile, signOut } = useAuth()
  const { partnership, partner, isLinked } = usePartnership()
  const { received, sent } = useInvitations()
  const { updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configuracoes</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de exibicao</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email ?? ''} disabled />
          </div>
          <Button
            onClick={() => updateProfile.mutate({ display_name: displayName })}
            disabled={updateProfile.isPending || displayName === profile?.display_name}
          >
            {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      {/* Partnership Section */}
      <Card>
        <CardHeader>
          <CardTitle>Parceiro(a)</CardTitle>
          <CardDescription>
            {isLinked
              ? 'Voce esta conectado(a) com seu parceiro(a).'
              : 'Convide seu parceiro(a) para compartilhar despesas.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLinked && partner ? (
            <PartnerCard partner={partner} partnership={partnership!} />
          ) : (
            <>
              <InvitePartnerDialog />
              {sent.length > 0 && <SentInvitations invitations={sent} />}
              {received.length > 0 && <PendingInvitations invitations={received} />}
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut}>
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Profile Edit
- `displayName` is pre-populated from the current profile
- Save button is disabled when value hasn't changed or save is in progress
- On save, the Zustand store is updated so the header/sidebar reflect the new name immediately

### Partnership Section Logic
- If `isLinked`: show PartnerCard with partner's name and email
- If NOT linked:
  - Show InvitePartnerDialog trigger button
  - Below it, show SentInvitations if any are pending
  - Show PendingInvitations if any received

## Acceptance Criteria
- [ ] Settings page displays current profile information
- [ ] User can edit and save their display name
- [ ] Email is shown but not editable
- [ ] Partnership section shows partner info when linked
- [ ] Partnership section shows invitation controls when not linked
- [ ] Sent and received invitations are displayed
- [ ] "Sair da conta" button logs the user out
- [ ] Profile updates persist and reflect immediately in the UI (header, sidebar)
- [ ] All text is in Portuguese

## Dependencies
- Depends on: Task 03 (auth), Task 04 (layout), Task 05 (partnership components)
- Blocks: None (leaf task)
