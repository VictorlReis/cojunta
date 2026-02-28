import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for OAuth error params
    const errorParam = searchParams.get('error_description') || searchParams.get('error')
    if (errorParam) {
      setError(errorParam)
      return
    }

    // If session is already established, redirect
    if (!isLoading && session) {
      navigate('/', { replace: true })
      return
    }

    // Timeout: if no session after 5 seconds, show error
    const timeout = setTimeout(() => {
      if (!session) {
        setError('Nao foi possivel completar o login. Tente novamente.')
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [session, isLoading, navigate, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-destructive">{error}</p>
        <a
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Voltar para o login
        </a>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
