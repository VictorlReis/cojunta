-- Allow invitees to view the profile of someone who sent them a pending invitation.
-- Without this policy, the profiles RLS only allows viewing one's own profile or
-- an active partner's profile -- meaning the inviter's name/email cannot be fetched
-- via the join in useInvitations before the partnership is created.
create policy "Invitees can view inviter profile"
  on public.profiles for select using (
    exists (
      select 1 from public.invitations
      where invitations.inviter_id = profiles.id
        and invitations.invitee_email = (
          select email from public.profiles p where p.id = auth.uid()
        )
        and invitations.status = 'pending'
    )
  );
