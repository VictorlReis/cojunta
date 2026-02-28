# Task 03: Authentication -- Login, Signup, Google OAuth, Auth Guard, Session Management

## Objective
Implement the complete authentication flow: signup with email/password, login with email/password, Google OAuth login, session persistence, auth state management via Zustand, and an AuthGuard component that protects routes.

## Context
The Supabase client is initialized in `src/lib/supabase.ts` (Task 01). The database schema including the `profiles` table and the `handle_new_user` trigger exists (Task 02). The Zustand auth store skeleton exists at `src/stores/authStore.ts` (Task 01). This task builds the full auth layer on top of those foundations.

UI text must be in Portuguese (pt-BR), hardcoded. Code in English.

## Requirements
- Signup page with email, password, display name fields
- Login page with email and password fields
- Google OAuth button on both login and signup pages
- Session persistence using Supabase's built-in `onAuthStateChange`
- Zustand store fully wired to Supabase auth events
- AuthGuard component that redirects unauthenticated users to `/login`
- Redirect authenticated users away from `/login` and `/signup` to `/`
- Loading state while auth session is being resolved on app startup
- Logout functionality
- Error handling with Portuguese error messages

## Existing Code References
- `src/lib/supabase.ts` -- Supabase client (Task 01)
- `src/stores/authStore.ts` -- Zustand store skeleton (Task 01)
- `src/types/database.ts` -- Profile type (Task 02)
- `src/components/ui/` -- shadcn/ui components (Button, Input, Label, Card) from Task 01

## Files to Create/Modify

```
src/stores/authStore.ts              # Enhance with full auth logic
src/hooks/useAuth.ts                 # Auth hook wrapping Supabase auth methods
src/components/auth/LoginForm.tsx    # Login form component
src/components/auth/SignupForm.tsx   # Signup form component
src/components/auth/OAuthButtons.tsx # Google OAuth button
src/components/auth/AuthGuard.tsx    # Route protection wrapper
src/pages/LoginPage.tsx              # Login page
src/pages/SignupPage.tsx             # Signup page
src/App.tsx                          # Update to wire auth, guards, and providers
```

## Implementation Details

### 1. Auth Store (`src/stores/authStore.ts`)
Expand the placeholder store:
```ts
interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setIsLoading: (isLoading: boolean) => void
  reset: () => void
}
```

### 2. Auth Hook (`src/hooks/useAuth.ts`)
Expose convenience methods:
```ts
export function useAuth() {
  const { user, session, profile, isLoading } = useAuthStore()

  const signUp = async (email: string, password: string, displayName: string) => { ... }
  const signIn = async (email: string, password: string) => { ... }
  const signInWithGoogle = async () => { ... }
  const signOut = async () => { ... }

  return { user, session, profile, isLoading, signUp, signIn, signInWithGoogle, signOut }
}
```

- `signUp`: Call `supabase.auth.signUp({ email, password, options: { data: { full_name: displayName } } })`. The trigger will create the profile.
- `signIn`: Call `supabase.auth.signInWithPassword({ email, password })`.
- `signInWithGoogle`: Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
- `signOut`: Call `supabase.auth.signOut()` and reset the store.

### 3. Session Initialization in App.tsx
On app mount, set up the auth listener:
```ts
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    authStore.setSession(session)
    authStore.setUser(session?.user ?? null)
    if (session?.user) {
      // Fetch profile
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => authStore.setProfile(data))
    }
    authStore.setIsLoading(false)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    authStore.setSession(session)
    authStore.setUser(session?.user ?? null)
    if (session?.user) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => authStore.setProfile(data))
    } else {
      authStore.setProfile(null)
    }
  })

  return () => subscription.unsubscribe()
}, [])
```

### 4. AuthGuard Component
```tsx
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner /> // Full-page centered spinner
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
```

### 5. Login Page
- Card centered on screen with app logo/name at top
- Email input + password input
- "Entrar" button (primary)
- Google OAuth button: "Entrar com Google"
- Link to signup: "Nao tem conta? Cadastre-se"
- Error display below form

### 6. Signup Page
- Card centered on screen
- Display name input + email input + password input + confirm password input
- "Criar Conta" button
- Google OAuth button
- Link to login: "Ja tem conta? Entrar"
- Password validation: minimum 6 characters

### 7. OAuth Buttons Component
Reusable component rendering a Google button:
```tsx
<Button variant="outline" onClick={signInWithGoogle} className="w-full">
  <GoogleIcon /> Entrar com Google
</Button>
```
Use an inline SVG for the Google icon or a simple text representation.

### 8. Route Updates in App.tsx
```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route element={<AuthGuard><Outlet /></AuthGuard>}>
    <Route path="/" element={<div>Dashboard placeholder</div>} />
    <Route path="/expenses" element={<div>Expenses placeholder</div>} />
    <Route path="/settings" element={<div>Settings placeholder</div>} />
  </Route>
</Routes>
```

### Error Messages (Portuguese)
Map common Supabase auth errors:
```ts
const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'User already registered': 'Este email ja esta cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Email not confirmed': 'Confirme seu email antes de entrar.',
}
```

## Acceptance Criteria
- [ ] Users can sign up with email, password, and display name
- [ ] Users can log in with email and password
- [ ] Google OAuth button initiates the OAuth flow correctly
- [ ] After login, user is redirected to `/` (dashboard)
- [ ] Unauthenticated users accessing `/`, `/expenses`, or `/settings` are redirected to `/login`
- [ ] Authenticated users accessing `/login` or `/signup` are redirected to `/`
- [ ] Session persists across page reloads
- [ ] Logout clears the session and redirects to `/login`
- [ ] Auth errors are displayed in Portuguese
- [ ] A loading spinner shows while the session is being resolved on initial load

## Dependencies
- Depends on: Task 01 (project setup), Task 02 (schema -- profiles table and trigger)
- Blocks: Task 04 (layout -- needs auth for user display), Task 05 (partnership), Task 06 (expenses)
