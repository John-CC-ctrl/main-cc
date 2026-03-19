import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function TopBar({ title }) {
  const { profile, firstName, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (firstName?.[0] ?? 'U').toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-slate-700 font-semibold text-base">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 hidden sm:block">
          {profile?.full_name ?? firstName}
        </span>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-sm font-semibold hover:bg-navy-light transition-colors"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
