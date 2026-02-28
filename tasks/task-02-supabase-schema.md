# Task 02: Supabase Database Schema, RLS Policies, Triggers, and Seed Data

## Objective
Create the complete Supabase database schema including all tables, Row Level Security policies, the auto-profile-creation trigger, and seed data for predefined categories. Also generate the TypeScript types that mirror the schema.

## Context
This task defines the entire data layer for Cojunta. The schema must support: user profiles linked to Supabase Auth, partnerships between two users, an invitation system, predefined expense categories, and expenses that can be individual or shared. All tables use RLS for security -- the Supabase anon key is used from the client, so RLS is the primary security boundary.

## Requirements
- Create SQL migration file(s) that can be run against a Supabase project
- Define all 5 tables: `profiles`, `partnerships`, `invitations`, `categories`, `expenses`
- Enable RLS on all tables with appropriate policies
- Create a database trigger that auto-creates a `profiles` row when a new user signs up via `auth.users`
- Seed the `categories` table with 10 predefined categories
- Write TypeScript types that match the schema exactly

## Files to Create

```
supabase/
  migrations/
    001_initial_schema.sql      # All tables, indexes, trigger
    002_rls_policies.sql        # All RLS policies
    003_seed_categories.sql     # Category seed data
src/types/
  database.ts                   # TypeScript types matching the schema
```

## Implementation Details

### 1. Tables (`001_initial_schema.sql`)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partnerships
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

-- Invitations
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

-- Categories (predefined, read-only for users)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default 'circle',
  color text not null default '#8B5CF6'
);

-- Expenses
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
```

### 2. RLS Policies (`002_rls_policies.sql`)

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.partnerships enable row level security;
alter table public.invitations enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

-- PROFILES
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

-- PARTNERSHIPS
create policy "Users can view own partnerships"
  on public.partnerships for select using (
    user1_id = auth.uid() or user2_id = auth.uid()
  );

create policy "Users can create partnerships"
  on public.partnerships for insert with check (user1_id = auth.uid());

create policy "Users can update partnerships they belong to"
  on public.partnerships for update using (
    user1_id = auth.uid() or user2_id = auth.uid()
  );

-- INVITATIONS
create policy "Inviters can view own invitations"
  on public.invitations for select using (inviter_id = auth.uid());

create policy "Invitees can view invitations sent to them"
  on public.invitations for select using (
    invitee_email = (select email from public.profiles where id = auth.uid())
  );

create policy "Users can create invitations"
  on public.invitations for insert with check (inviter_id = auth.uid());

create policy "Inviters can cancel own invitations"
  on public.invitations for update using (inviter_id = auth.uid());

create policy "Invitees can accept invitations"
  on public.invitations for update using (
    invitee_email = (select email from public.profiles where id = auth.uid())
  );

-- CATEGORIES (read-only for all authenticated users)
create policy "Authenticated users can view categories"
  on public.categories for select using (auth.role() = 'authenticated');

-- EXPENSES
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
```

### 3. Seed Data (`003_seed_categories.sql`)

```sql
insert into public.categories (name, icon, color) values
  ('Alimentacao', 'utensils', '#FF6384'),
  ('Transporte', 'car', '#36A2EB'),
  ('Moradia', 'home', '#FFCE56'),
  ('Saude', 'heart-pulse', '#4BC0C0'),
  ('Educacao', 'graduation-cap', '#9966FF'),
  ('Lazer', 'gamepad-2', '#FF9F40'),
  ('Vestuario', 'shirt', '#C9CBCF'),
  ('Contas e Servicos', 'receipt', '#7BC8A4'),
  ('Compras', 'shopping-bag', '#E7E9ED'),
  ('Outros', 'circle-ellipsis', '#8B5CF6');
```

### 4. TypeScript Types (`src/types/database.ts`)

Define types that match the schema precisely. Include both `Row`, `Insert`, and `Update` variants for each table (mirroring Supabase generated types style):

```ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; display_name: string; avatar_url: string | null; created_at: string; updated_at: string }
        Insert: { id: string; email: string; display_name?: string; avatar_url?: string | null }
        Update: { display_name?: string; avatar_url?: string | null }
      }
      partnerships: {
        Row: { id: string; user1_id: string; user2_id: string; status: 'pending' | 'active' | 'dissolved'; created_at: string; updated_at: string }
        Insert: { user1_id: string; user2_id: string; status?: string }
        Update: { status?: 'pending' | 'active' | 'dissolved' }
      }
      invitations: {
        Row: { id: string; inviter_id: string; invitee_email: string; invite_code: string; status: 'pending' | 'accepted' | 'expired' | 'cancelled'; created_at: string; expires_at: string }
        Insert: { inviter_id: string; invitee_email: string }
        Update: { status?: 'pending' | 'accepted' | 'expired' | 'cancelled' }
      }
      categories: {
        Row: { id: string; name: string; icon: string; color: string }
        Insert: { name: string; icon?: string; color?: string }
        Update: { name?: string; icon?: string; color?: string }
      }
      expenses: {
        Row: { id: string; user_id: string; partnership_id: string | null; category_id: string; description: string; amount: number; expense_date: string; is_shared: boolean; created_at: string; updated_at: string }
        Insert: { user_id: string; partnership_id?: string | null; category_id: string; description?: string; amount: number; expense_date?: string; is_shared?: boolean }
        Update: { category_id?: string; description?: string; amount?: number; expense_date?: string; is_shared?: boolean; partnership_id?: string | null }
      }
    }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Partnership = Database['public']['Tables']['partnerships']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']

export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']
export type InvitationInsert = Database['public']['Tables']['invitations']['Insert']
```

Also export these from `src/types/index.ts`:
```ts
export * from './database'
```

## Acceptance Criteria
- [ ] All SQL files are syntactically valid and can be run in order against a fresh Supabase project
- [ ] The `handle_new_user` trigger correctly creates a profile on signup
- [ ] RLS policies allow users to only see their own data and their partner's shared expenses
- [ ] Categories are seeded with 10 predefined entries
- [ ] TypeScript types in `src/types/database.ts` match the SQL schema exactly
- [ ] Types compile without errors when imported in other files

## Dependencies
- Depends on: Task 01 (project setup -- for the `src/types/` directory to exist)
- Blocks: Task 03 (auth), Task 05 (partnership), Task 06 (expenses), Task 07 (categories hook)
