import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

interface GuestGuardProps {
  children: React.ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { session, isLoading } = useAuthStore()

  if (isLoading) return <LoadingSpinner />
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}
