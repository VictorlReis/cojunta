# Task 04: App Layout, Sidebar Navigation, Header, and Mobile Navigation

## Objective
Build the main application shell: a responsive layout with a sidebar on desktop, a mobile bottom navigation / sheet menu, a header with user info and logout, and the page wrapper that all authenticated pages share.

## Context
Authentication is in place (Task 03) with the `useAuth` hook and `AuthGuard`. The layout must wrap all authenticated routes and provide navigation between Dashboard (`/`), Expenses (`/expenses`), and Settings (`/settings`). The layout should be responsive -- sidebar on desktop (768px+), bottom nav or hamburger sheet on mobile.

UI text in Portuguese. Code in English.

## Requirements
- `AppLayout` component that wraps authenticated pages via `<Outlet />`
- Desktop sidebar with navigation links and app branding
- Header bar with user display name, avatar placeholder, and logout button
- Mobile-responsive: sidebar collapses to a sheet or bottom navigation on small screens
- Active route highlighting in navigation
- Clean, modern aesthetic using shadcn/ui + Tailwind

## Existing Code References
- `src/components/ui/` -- shadcn/ui components: Sheet, Button, Separator, DropdownMenu
- `src/hooks/useAuth.ts` -- for user profile data and signOut
- `src/stores/authStore.ts` -- for profile/user data
- `src/App.tsx` -- route definitions to wrap with layout

## Files to Create/Modify

```
src/components/layout/AppLayout.tsx     # Main layout wrapper
src/components/layout/Sidebar.tsx       # Desktop sidebar
src/components/layout/Header.tsx        # Top header bar
src/components/layout/MobileNav.tsx     # Mobile navigation (bottom nav or sheet)
src/App.tsx                             # Wrap authenticated routes with AppLayout
```

## Implementation Details

### 1. AppLayout (`src/components/layout/AppLayout.tsx`)
```tsx
export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="hidden md:flex" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <MobileNav className="md:hidden" />
    </div>
  )
}
```

### 2. Sidebar (`src/components/layout/Sidebar.tsx`)
- Fixed width (e.g., 240px) on the left
- App name "Cojunta" at the top as branding
- Navigation items using `NavLink` from React Router:
  - "Painel" (Dashboard icon) -> `/`
  - "Despesas" (Wallet/receipt icon) -> `/expenses`
  - "Configuracoes" (Settings icon) -> `/settings`
- Active link gets a distinct background color (e.g., `bg-accent`)
- Use Lucide icons (already included with shadcn/ui): `LayoutDashboard`, `Receipt`, `Settings`
- At the bottom of sidebar: user name + small logout button

### 3. Header (`src/components/layout/Header.tsx`)
- Shows on all screen sizes
- Left: hamburger menu button (mobile only, opens Sheet with nav links)
- Center/left: page title (optional, can derive from route)
- Right: user avatar circle (initials if no avatar_url) + display_name + dropdown with "Sair" (logout)
- Use `DropdownMenu` from shadcn/ui for the user menu

### 4. MobileNav (`src/components/layout/MobileNav.tsx`)
- Fixed at bottom of screen on mobile
- Three icons: Painel, Despesas, Configuracoes
- Active item highlighted
- Simple bottom tab bar pattern using `NavLink`

### 5. Update App.tsx
Wrap the authenticated routes with `AppLayout`:
```tsx
<Route element={<AuthGuard><AppLayout /></AuthGuard>}>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/expenses" element={<ExpensesPage />} />
  <Route path="/settings" element={<SettingsPage />} />
</Route>
```

For now, page components can be simple placeholders if not yet implemented.

### Navigation Items Array
Define a shared array to keep sidebar and mobile nav consistent:
```ts
const NAV_ITEMS = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Despesas', path: '/expenses', icon: Receipt },
  { label: 'Configuracoes', path: '/settings', icon: Settings },
]
```

## Acceptance Criteria
- [ ] Authenticated pages show inside the layout with sidebar (desktop) and bottom nav (mobile)
- [ ] Navigation links work and highlight the active route
- [ ] User display name appears in the header
- [ ] Logout button works (clears session, redirects to login)
- [ ] Layout is responsive: sidebar visible on md+ screens, bottom nav on smaller screens
- [ ] App compiles and renders without errors

## Dependencies
- Depends on: Task 01 (project setup, shadcn/ui), Task 03 (authentication -- useAuth, AuthGuard)
- Blocks: Task 08 (dashboard page), Task 09 (expenses page), Task 10 (settings page)
