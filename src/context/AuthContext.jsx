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

  // Auth state listener — only updates user, never does async DB work directly.
  // Doing async DB queries inside onAuthStateChange is unreliable because the
  // Supabase client's auth headers may not be set yet when the callback fires.
  useEffect(() => {
    // getSession covers the initial load (including post-OAuth PKCE redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Profile fetch — runs in a separate effect after auth state has settled.
  // setTimeout(0) defers the DB query to after Supabase has committed the
  // session internally, ensuring auth headers are present in the request.
  useEffect(() => {
    if (!user) return
    const id = setTimeout(() => {
      console.log('[Auth] fetching profile for', user.id)
      fetchProfile(user.id, user.email).then((profileData) => {
        console.log('[Auth] profile result:', profileData)
        setProfile(profileData)
      })
    }, 0)
    return () => clearTimeout(id)
  }, [user?.id])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

  // scope: 'local' ensures the session is always cleared locally even if the
  // token-revocation API call fails, fixing the "stuck signed-in" bug.
  const signOut = () => supabase.auth.signOut({ scope: 'local' })

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
