# Updated PRD: Cojunta -- Couple's Financial Expense Tracker (Phase 1)

## Overview

Cojunta is a web application for couples to track and manage their finances together. Two users create accounts, link via an in-app invitation system, and from that point share a joint view of expenses while retaining individual expense visibility. Phase 1 delivers the core MVP: authentication, partner linking, expense CRUD, predefined categories, monthly list views, and a dashboard with basic charts.

## Tech Stack (Confirmed)

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3.x |
| UI Components | shadcn/ui |
| Charts | Recharts |
| Routing | React Router v6 |
| Server State | TanStack Query (React Query) v5 |
| Client State | Zustand (minimal -- auth user, UI state only) |
| Backend / DB | Supabase (Auth, PostgreSQL, Realtime, Row Level Security) |
| Package Manager | npm |

## Language Convention

- **UI text**: Portuguese (pt-BR), hardcoded directly in components. No i18n library.
- **Code**: English -- variable names, function names, comments, commit messages, file names.

## Codebase Status

**Greenfield.** The repository contains only the claude-setup template. Everything described below must be created from scratch.

---

## Data Model

### Tables

#### `profiles`
Extends Supabase `auth.users`. Created automatically via a database trigger on user signup.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References `auth.users.id` |
| email | text | Copied from auth |
| display_name | text | User's chosen display name |
| avatar_url | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

#### `partnerships`
Represents the link between two users (a couple).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| user1_id | uuid (FK) | References profiles.id -- the user who created the partnership |
| user2_id | uuid (FK) | References profiles.id -- the user who accepted |
| status | text | 'pending' or 'active' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Constraints: A user can only be in ONE active partnership at a time. Enforced via RLS + application logic.

#### `invitations`
Tracks pending partner invitations.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| inviter_id | uuid (FK) | References profiles.id |
| invitee_email | text | Email of the person being invited |
| invite_code | text | Unique 8-char code |
| status | text | 'pending', 'accepted', 'expired', 'cancelled' |
| created_at | timestamptz | default now() |
| expires_at | timestamptz | default now() + interval '7 days' |

#### `categories`
Predefined expense categories (seeded, not user-editable in Phase 1).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| name | text | e.g., 'Alimentacao', 'Transporte', 'Moradia' |
| icon | text | Icon name string (e.g., 'utensils', 'car', 'home') |
| color | text | Hex color for charts |

Seed data (predefined categories):
1. Alimentacao (#FF6384)
2. Transporte (#36A2EB)
3. Moradia (#FFCE56)
4. Saude (#4BC0C0)
5. Educacao (#9966FF)
6. Lazer (#FF9F40)
7. Vestuario (#C9CBCF)
8. Contas e Servicos (#7BC8A4)
9. Compras (#E7E9ED)
10. Outros (#8B5CF6)

#### `expenses`
Core expense records.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| user_id | uuid (FK) | References profiles.id -- who created the expense |
| partnership_id | uuid (FK) | References partnerships.id, nullable -- null = individual expense |
| category_id | uuid (FK) | References categories.id |
| description | text | Free text description |
| amount | numeric(12,2) | Expense value in BRL |
| expense_date | date | When the expense occurred |
| is_shared | boolean | default false -- whether this expense is visible to partner |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

- **profiles**: Users can read/update their own profile. Users can read their partner's profile (via active partnership).
- **partnerships**: Users can read partnerships they belong to. Users can create partnerships (as user1). User2 can update status to 'active' (accept).
- **invitations**: Inviters can read/create/cancel their own invitations. Invitees can read invitations sent to their email and update status to 'accepted'.
- **categories**: All authenticated users can read.
- **expenses**: Users can CRUD their own expenses. Users can read partner's expenses where `is_shared = true` and they share an active partnership.

---

## Application Architecture

### Directory Structure

```
src/
  components/
    ui/               # shadcn/ui components (Button, Input, Card, Dialog, etc.)
    layout/           # AppLayout, Sidebar, Header, MobileNav
    expenses/         # ExpenseForm, ExpenseList, ExpenseItem, ExpenseFilters
    dashboard/        # DashboardCards, CategoryPieChart, MonthlyTrendChart
    partnership/      # InvitePartnerDialog, PendingInvitation, PartnerCard
    auth/             # LoginForm, SignupForm, OAuthButtons, AuthGuard
  pages/
    LoginPage.tsx
    SignupPage.tsx
    DashboardPage.tsx
    ExpensesPage.tsx
    SettingsPage.tsx
  hooks/
    useAuth.ts
    useExpenses.ts
    usePartnership.ts
    useCategories.ts
  lib/
    supabase.ts       # Supabase client initialization
    utils.ts          # Utility functions (formatCurrency, formatDate, etc.)
    constants.ts      # App-wide constants
  types/
    database.ts       # Generated/manual Supabase types
    index.ts          # App-level type exports
  stores/
    authStore.ts      # Zustand store for auth state
  App.tsx
  main.tsx
  index.css           # Tailwind directives + global styles
```

### Routing

| Path | Page | Auth Required |
|------|------|---------------|
| `/login` | LoginPage | No |
| `/signup` | SignupPage | No |
| `/` | DashboardPage | Yes |
| `/expenses` | ExpensesPage | Yes |
| `/settings` | SettingsPage | Yes |

### Authentication Flow

1. User signs up with email/password OR Google OAuth.
2. On signup, a database trigger creates a `profiles` row.
3. Supabase session is stored in local storage (Supabase default).
4. Zustand `authStore` holds the current user/session for quick access.
5. `AuthGuard` component wraps protected routes, redirects to `/login` if unauthenticated.
6. On login, app checks for pending invitations and active partnerships.

### Partner Invitation Flow

1. User A navigates to Settings, enters User B's email, clicks "Enviar Convite".
2. System creates an `invitations` row with a unique `invite_code` and status 'pending'.
3. When User B logs in, the app queries `invitations` where `invitee_email = user.email AND status = 'pending'`.
4. User B sees a banner/notification showing the pending invitation with User A's name.
5. User B clicks "Aceitar" -- system updates invitation status to 'accepted' and creates a `partnerships` row with status 'active'.
6. Both users now see shared expenses from each other.

### Expense Views

**Expenses Page** (`/expenses`):
- Monthly view with date filters (month/year selector).
- Toggle between: "Meus Gastos" (my expenses), "Gastos Compartilhados" (shared expenses from both partners), "Todos" (all visible expenses).
- Each expense shows: date, description, category (with color/icon), amount, shared badge.
- Add expense button opens a form dialog.
- Inline edit and delete with confirmation.
- Summary bar at top showing total for current filter.

**Dashboard Page** (`/`):
- Summary cards: Total do Mes, Meus Gastos, Gastos Compartilhados, Gastos do(a) Parceiro(a).
- Pie chart: Breakdown by category for the current month.
- Line chart: Monthly spending trend (last 6 months), with separate lines for individual vs shared.
- Month selector to change the reference period.

---

## Phase 1 Scope (Confirmed)

### In Scope
- [x] Project setup (Vite, Tailwind, shadcn/ui, routing, Supabase client)
- [x] Supabase schema (all tables, RLS policies, seed data, trigger for profiles)
- [x] Authentication (email/password + Google OAuth, signup, login, logout)
- [x] User profile display
- [x] Partner invitation system (send, receive, accept invitations in-app)
- [x] Partnership creation and status management
- [x] Expense CRUD (create, read, update, delete)
- [x] Predefined categories (seeded, read-only)
- [x] Expense list view with monthly filtering
- [x] Expense view toggle (individual / shared / all)
- [x] Dashboard with summary cards
- [x] Category pie chart (Recharts)
- [x] Monthly trend line chart (Recharts)
- [x] Responsive layout (mobile-friendly)

### Out of Scope (Phase 2)
- [ ] Custom user-created categories
- [ ] Recurring/scheduled expenses
- [ ] Budget goals and limits per category
- [ ] Data export (CSV, PDF)
- [ ] Push notifications
- [ ] Advanced analytics and reports
- [ ] Split expense (percentage-based sharing)
- [ ] Multi-currency support
- [ ] PWA / offline support

---

## Non-Functional Requirements

- **TypeScript strict mode** enabled.
- **No `any` types** -- use proper typing throughout.
- **Consistent error handling** -- all Supabase calls wrapped with error handling, user-facing error messages in Portuguese.
- **Loading states** -- skeleton loaders or spinners for all async operations.
- **Optimistic updates** -- use TanStack Query mutation callbacks for instant UI feedback on CRUD operations.
- **Mobile-first** -- layout must work on 375px+ viewports.
