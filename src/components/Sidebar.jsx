import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  owner: 'Owner',
  office_admin: 'Office Admin',
  sales_manager: 'Sales Manager',
}

const ROLE_COLORS = {
  owner: 'bg-yellow-500 text-yellow-900',
  office_admin: 'bg-blue-400 text-blue-900',
  sales_manager: 'bg-green-400 text-green-900',
}

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-navy-hover text-white'
            : 'text-slate-300 hover:bg-navy-light hover:text-white'
        }`
      }
    >
      <span className="text-lg leading-none">{icon}</span>
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const { profile, role, firstName, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-navy-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
            CC
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Cobalt Clean</div>
            <div className="text-slate-400 text-xs">Operations Hub</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem to="/dashboard" label="Dashboard" icon="⊞" />
        <NavItem to="/pricing" label="Pricing Calculator" icon="💲" />
        {role === 'owner' && (
          <NavItem to="/admin/users" label="User Management" icon="👥" />
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-navy-light">
        <div className="mb-3">
          <div className="text-white text-sm font-medium truncate">
            {profile?.full_name ?? firstName}
          </div>
          <div className="text-slate-400 text-xs truncate">{profile?.email}</div>
          {role && (
            <span
              className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[role] ?? 'bg-slate-500 text-white'}`}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-navy-light hover:text-white transition-colors"
        >
          ← Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-navy rounded-md text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-navy z-40 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      {/* Sidebar — desktop fixed */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-navy fixed top-0 left-0 z-20">
        {navContent}
      </aside>
    </>
  )
}
