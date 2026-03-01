-- Break the circular RLS dependency that causes infinite recursion:
--
--   profiles policy (010) → queries invitations
--   → invitations SELECT policy → queries public.profiles for email
--   → triggers profiles policies again → infinite recursion
--
-- Fix: replace the public.profiles subquery in invitations policies with
-- auth.jwt() ->> 'email', which reads directly from the session token
-- and never touches any table.

drop policy if exists "Invitees can view invitations sent to them" on public.invitations;
drop policy if exists "Invitees can accept invitations" on public.invitations;

create policy "Invitees can view invitations sent to them"
  on public.invitations for select using (
    invitee_email = (auth.jwt() ->> 'email')
  );

create policy "Invitees can accept invitations"
  on public.invitations for update
  using (invitee_email = (auth.jwt() ->> 'email'))
  with check (status = 'accepted');
