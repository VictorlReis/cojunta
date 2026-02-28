# Cojunta -- Phase 1 Task Files

## Summary
Cojunta is a couple's financial expense tracker built with React + Vite + Supabase. Phase 1 delivers: authentication (email/password + Google OAuth), partner invitation/linking, expense CRUD with predefined categories, monthly expense list view, and a dashboard with category pie chart and monthly trend line chart.

## Task Count and Complexity
**10 tasks** total. Estimated complexity: Medium-Large (greenfield project with auth, real-time data, and multiple UI views).

## Task Overview

| # | Task | Description | Depends On |
|---|------|-------------|------------|
| 01 | Project Setup | Vite, TS, Tailwind, shadcn/ui, routing, providers | None |
| 02 | Supabase Schema | Tables, RLS, triggers, seed data, TS types | 01 |
| 03 | Authentication | Login, signup, OAuth, session, AuthGuard | 01, 02 |
| 04 | Layout & Navigation | Sidebar, header, mobile nav, AppLayout | 01, 03 |
| 05 | Partnership & Invitations | Invite, accept, link partners | 01, 02, 03, 04 |
| 06 | Expense CRUD | Hooks, form, item component, filters | 01, 02, 03, 05 |
| 07 | Dashboard Charts | Pie chart, line chart, summary cards, data hook | 01, 02, 06 |
| 08 | Dashboard Page | Assemble dashboard components into page | 04, 05, 07 |
| 09 | Expenses Page | Assemble expense list, filters, CRUD into page | 04, 06 |
| 10 | Settings Page | Profile edit, partnership management, logout | 03, 04, 05 |

## Dependency Graph

```
Task 01 (Project Setup)
  |
  +---> Task 02 (Supabase Schema)
  |       |
  |       +---> Task 03 (Authentication)
  |               |
  |               +---> Task 04 (Layout & Navigation)
  |               |       |
  |               |       +---> Task 08 (Dashboard Page)
  |               |       +---> Task 09 (Expenses Page)
  |               |       +---> Task 10 (Settings Page)
  |               |
  |               +---> Task 05 (Partnership & Invitations)
  |                       |
  |                       +---> Task 06 (Expense CRUD)
  |                       |       |
  |                       |       +---> Task 07 (Dashboard Charts)
  |                       |       |       |
  |                       |       |       +---> Task 08 (Dashboard Page)
  |                       |       |
  |                       |       +---> Task 09 (Expenses Page)
  |                       |
  |                       +---> Task 08 (Dashboard Page)
  |                       +---> Task 10 (Settings Page)
```

## Parallelization Waves

Given the dependency graph, tasks can be executed in these waves:

1. **Wave 1**: Task 01
2. **Wave 2**: Task 02
3. **Wave 3**: Task 03
4. **Wave 4**: Task 04, Task 05 (parallel after auth)
5. **Wave 5**: Task 06, Task 10 (parallel -- expenses needs partnership, settings needs partnership)
6. **Wave 6**: Task 07, Task 09 (parallel -- charts needs expenses, expenses page needs expense CRUD)
7. **Wave 7**: Task 08

## Instructions

These task files are prompts for AI agents. Each file contains all the context an agent needs to execute the task independently. Delete each file after the task is completed. When all files are deleted, Phase 1 is complete.

## Open Questions

- **Supabase project URL and keys**: The implementing agent will need actual Supabase project credentials in `.env.local`. The project must be created manually in the Supabase dashboard first.
- **Google OAuth**: Google OAuth provider must be configured in the Supabase dashboard (Authentication > Providers > Google) with the appropriate client ID and secret from Google Cloud Console.
- **Email confirmation**: Supabase email confirmation is enabled by default. For development, it may be useful to disable it in the Supabase dashboard (Authentication > Settings) to simplify testing.
