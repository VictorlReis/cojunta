-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table public.profiles enable row level security;
alter table public.partnerships enable row level security;
alter table public.invitations enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can view partner profile"
  on public.profiles for select using (
    exists (
      select 1 from public.partnerships
      where status = 'active'
        and ((user1_id = auth.uid() and user2_id = profiles.id)
          or (user2_id = auth.uid() and user1_id = profiles.id))
    )
  );

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- PARTNERSHIPS
-- ============================================================
create policy "Users can view own partnerships"
  on public.partnerships for select using (
    user1_id = auth.uid() or user2_id = auth.uid()
  );

create policy "Users can create partnerships"
  on public.partnerships for insert with check (user1_id = auth.uid());

create policy "Users can update partnerships they belong to"
  on public.partnerships for update
  using (user1_id = auth.uid() or user2_id = auth.uid())
  with check (status in ('active', 'dissolved'));

-- ============================================================
-- INVITATIONS
-- ============================================================
create policy "Inviters can view own invitations"
  on public.invitations for select using (inviter_id = auth.uid());

create policy "Invitees can view invitations sent to them"
  on public.invitations for select using (
    invitee_email = (select email from public.profiles where id = auth.uid())
  );

create policy "Users can create invitations"
  on public.invitations for insert with check (inviter_id = auth.uid());

create policy "Inviters can cancel own invitations"
  on public.invitations for update
  using (inviter_id = auth.uid())
  with check (status = 'cancelled');

create policy "Invitees can accept invitations"
  on public.invitations for update
  using (invitee_email = (select email from public.profiles where id = auth.uid()))
  with check (status = 'accepted');

-- ============================================================
-- CATEGORIES (read-only for all authenticated users)
-- ============================================================
create policy "Authenticated users can view categories"
  on public.categories for select using (auth.role() = 'authenticated');

-- ============================================================
-- EXPENSES
-- ============================================================
create policy "Users can view own expenses"
  on public.expenses for select using (user_id = auth.uid());

create policy "Users can view shared partner expenses"
  on public.expenses for select using (
    is_shared = true
    and exists (
      select 1 from public.partnerships
      where status = 'active'
        and ((user1_id = auth.uid() and user2_id = expenses.user_id)
          or (user2_id = auth.uid() and user1_id = expenses.user_id))
    )
  );

create policy "Users can insert own expenses"
  on public.expenses for insert with check (user_id = auth.uid());

create policy "Users can update own expenses"
  on public.expenses for update using (user_id = auth.uid());

create policy "Users can delete own expenses"
  on public.expenses for delete using (user_id = auth.uid());
