# Planning Questions

## Codebase Summary

The repository at `C:\Users\victo\code\cojunta` is a **greenfield project** -- it contains only the claude-setup template (agents, skills, devcontainer config) with zero application code. There is no `package.json`, no source files, no Supabase configuration, and no UI components. Everything needs to be built from scratch.

The project name "cojunta" suggests a couples-oriented financial app. The PRD specifies React + Vite + Supabase for a couple's expense tracker with shared and individual expense views, charts, categories, and a partner invitation system.

---

## Questions

### Q1: UI Component Library and Styling Approach
**Context:** Since this is a greenfield React + Vite project, the choice of UI framework will shape every subsequent task. This decision affects development speed, visual quality, and the complexity of building the dashboard with charts and tables.
**Question:** Which UI component library and styling approach should be used?
**Options:**
- A) **shadcn/ui + Tailwind CSS** -- Modern, copy-paste components, highly customizable, great for dashboards. Pairs well with Recharts or similar charting libs.
- B) **Material UI (MUI)** -- Batteries-included, mature ecosystem, built-in data grid for expense tables, but heavier bundle and more opinionated styling.
- C) **Chakra UI** -- Good middle ground, accessible by default, simpler API than MUI but less components than shadcn.
- D) **Ant Design** -- Enterprise-focused, excellent table/chart components out of the box, but heavier and less common in BR market.

### Q2: Charting Library
**Context:** The PRD requires charts showing expense evolution over months, category breakdowns, and potentially comparisons between individual and shared expenses. The charting library choice affects both the visual output and the complexity of implementation.
**Question:** Which charting library should be used for the financial visualizations?
**Options:**
- A) **Recharts** -- Most popular React charting lib, declarative API, good for line/bar/pie charts. Lightweight and well-documented.
- B) **Chart.js (via react-chartjs-2)** -- Very mature, wide variety of chart types, canvas-based (better performance with large datasets).
- C) **Nivo** -- Beautiful defaults, built on D3, responsive by default, but heavier.
- D) **Tremor** -- Designed specifically for dashboards, pairs perfectly with Tailwind, but smaller ecosystem.

### Q3: Authentication Strategy
**Context:** Supabase offers multiple auth methods. Since this is a couples app where two users need to link accounts, the auth flow directly impacts UX and the partner invitation system. The PRD mentions an in-app invitation mechanism.
**Question:** What authentication method should be supported for Supabase Auth?
**Options:**
- A) **Email/password only** -- Simplest to implement, sufficient for Phase 1. Partner invitations sent via email with a magic link or invite code.
- B) **Email/password + Google OAuth** -- Adds social login convenience with minimal extra effort since Supabase supports it natively.
- C) **Magic link (passwordless) only** -- Modern UX, no passwords to manage, but requires email access every login.
- D) **Email/password + Google OAuth + Magic link** -- Maximum flexibility but more UI states to handle in Phase 1.

### Q4: Language -- Portuguese or English
**Context:** The PRD is written in Portuguese and the app is clearly targeted at Brazilian users (couple's finance). However, the codebase (variable names, comments, commit messages) could be in either language. This affects developer experience and future maintainability.
**Question:** What language should be used for the application UI and codebase?
**Options:**
- A) **UI in Portuguese (pt-BR), code in English** -- Best practice: user-facing text in pt-BR, all code/comments/commits in English. Use i18n library (e.g., react-i18next) from the start for future localization.
- B) **UI in Portuguese (pt-BR), code in English, no i18n** -- Same as above but hardcode Portuguese strings directly. Simpler for Phase 1, can add i18n later if needed.
- C) **Everything in Portuguese** -- UI, variable names, comments all in Portuguese. Simpler for a solo/small team that only speaks Portuguese.
- D) **UI in English, code in English** -- Standard approach but doesn't match the target audience.

### Q5: Phase 1 Scope -- What "main features" means exactly
**Context:** The PRD mentions "all main features working" in Phase 1, but the boundary between Phase 1 and Phase 2 is not clearly defined. Clarifying scope now prevents over-building or missing critical features. Key areas to scope: expense CRUD, categories, charts, shared vs individual views, partner invitation, and data export.
**Question:** Which of the following should be included in Phase 1 vs deferred to Phase 2?
**Options:**
- A) **Phase 1 = Core MVP**: Auth + partner invitation/linking + expense CRUD (add/edit/delete) + categories (predefined set) + monthly expense list view + one summary dashboard with basic charts (total by category pie chart, monthly trend line chart). Phase 2 = custom categories, advanced reports, data export, budget goals, recurring expenses.
- B) **Phase 1 = Full Feature Set**: Everything in A plus custom categories, recurring expenses, budget limits per category, and multiple chart views. Phase 2 = notifications, data export, advanced analytics, mobile optimization.
- C) **Phase 1 = Minimal Viable**: Auth + partner invitation + expense CRUD + basic list view only (no charts, no categories beyond a text field). Phase 2 = everything else. Get the data model and sharing right first.
