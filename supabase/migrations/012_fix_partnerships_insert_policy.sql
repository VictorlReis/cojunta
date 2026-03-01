-- The original INSERT policy required user1_id = auth.uid(), which broke when
-- the invitee (who becomes user2) tried to create the partnership after
-- accepting an invitation. Make the policy symmetric: the authenticated user
-- must be present as either user1 or user2.
drop policy if exists "Users can create partnerships" on public.partnerships;

create policy "Users can create partnerships"
  on public.partnerships for insert
  with check (user1_id = auth.uid() or user2_id = auth.uid());
