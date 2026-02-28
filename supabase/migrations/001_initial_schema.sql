-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PARTNERSHIPS
-- ============================================================
create table public.partnerships (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'dissolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partnerships_different_users check (user1_id != user2_id)
);

-- Index for quickly finding a user's partnership
create index idx_partnerships_user1 on public.partnerships(user1_id);
create index idx_partnerships_user2 on public.partnerships(user2_id);

-- ============================================================
-- INVITATIONS
-- ============================================================
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text not null,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index idx_invitations_invitee_email on public.invitations(invitee_email);
create index idx_invitations_inviter on public.invitations(inviter_id);

-- ============================================================
-- CATEGORIES (predefined, read-only for users)
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default 'circle',
  color text not null default '#8B5CF6'
);

-- ============================================================
-- EXPENSES
-- ============================================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  partnership_id uuid references public.partnerships(id) on delete set null,
  category_id uuid not null references public.categories(id),
  description text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expenses_user on public.expenses(user_id);
create index idx_expenses_partnership on public.expenses(partnership_id);
create index idx_expenses_date on public.expenses(expense_date);
create index idx_expenses_category on public.expenses(category_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at auto-update trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger partnerships_updated_at before update on public.partnerships
  for each row execute function public.update_updated_at();

create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.update_updated_at();
