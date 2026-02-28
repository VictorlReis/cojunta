import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, reset } = useAuthStore()

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
      },
    })
    if (error) throw error
    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    reset()
  }

  return {
    user,
    session,
    profile,
    isLoading,
    setUser,
    setSession,
    setProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }
}
