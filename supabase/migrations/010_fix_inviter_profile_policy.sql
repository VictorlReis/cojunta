-- Fix infinite recursion in the "Invitees can view inviter profile" policy.
-- The previous version (009) subqueried public.profiles to get the current
-- user's email, which triggered the profiles RLS recursively.
-- Use auth.jwt() ->> 'email' instead -- reads directly from the JWT token,
-- no table lookup required.

drop policy if exists "Invitees can view inviter profile" on public.profiles;

create policy "Invitees can view inviter profile"
  on public.profiles for select using (
    exists (
      select 1 from public.invitations
      where invitations.inviter_id = profiles.id
        and invitations.invitee_email = (auth.jwt() ->> 'email')
        and invitations.status = 'pending'
    )
  );
