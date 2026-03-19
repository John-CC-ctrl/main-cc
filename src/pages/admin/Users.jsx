import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'

const ROLES = ['owner', 'office_admin', 'sales_manager']

const ROLE_LABELS = {
  owner: 'Owner',
  office_admin: 'Office Admin',
  sales_manager: 'Sales Manager',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Failed to load users. ' + error.message)
    } else {
      setUsers(data ?? [])
    }
    setLoading(false)
  }

  async function handleRoleChange(userId, newRole) {
    setUpdating(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Failed to update role: ' + error.message)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
    setUpdating(null)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar title="User Management" />

        <main className="flex-1 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">User Management</h2>
            <p className="text-slate-500 text-sm">
              Manage staff roles and access. New users default to <strong>Sales Manager</strong> until
              promoted here.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-slate-500 text-sm animate-pulse">Loading users…</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-slate-500 font-semibold px-5 py-3">Name</th>
                    <th className="text-left text-slate-500 font-semibold px-5 py-3">Email</th>
                    <th className="text-left text-slate-500 font-semibold px-5 py-3">Role</th>
                    <th className="text-left text-slate-500 font-semibold px-5 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {u.full_name || '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{u.email}</td>
                        <td className="px-5 py-3">
                          <select
                            value={u.role}
                            disabled={updating === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-navy disabled:opacity-50"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          {updating === u.id && (
                            <span className="ml-2 text-xs text-slate-400 animate-pulse">Saving…</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
