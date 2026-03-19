import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId, userEmail) {
    // Primary lookup: by auth UUID
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) return data

    if (error) {
      console.error('Error fetching profile by id:', error.message)
    }

    // Fallback: lookup by email. Handles the case where the profile row was
    // manually inserted before the user's first sign-in and has a wrong UUID.
    if (userEmail) {
      const { data: byEmail, error: emailErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle()

      if (!emailErr && byEmail) return byEmail
      if (emailErr) console.error('Error fetching profile by email:', emailErr.message)
    }

    return null
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id, session.user.email)
        setProfile(profileData)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id, session.user.email)
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

  const signOut = () => supabase.auth.signOut()

  const role = profile?.role ?? null
  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'User'

  return (
    <AuthContext.Provider value={{ user, profile, role, firstName, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
