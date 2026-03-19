import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

const ROLE_LABELS = {
  owner: 'Owner',
  office_admin: 'Office Admin',
  sales_manager: 'Sales Manager',
}

const ROLE_COLORS = {
  owner: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  office_admin: 'bg-blue-100 text-blue-800 border border-blue-200',
  sales_manager: 'bg-green-100 text-green-800 border border-green-200',
}

function ToolCard({ icon, title, description, href }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-slate-800 font-semibold text-base mb-1">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => navigate(href)}
        className="mt-auto self-start bg-navy hover:bg-navy-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Open →
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { firstName, role } = useAuth()

  const tools = [
    {
      icon: '💲',
      title: 'Pricing Calculator',
      description: 'Generate accurate cleaning quotes for residential and commercial clients.',
      href: '/pricing',
      roles: ['owner', 'office_admin', 'sales_manager'],
    },
    {
      icon: '👥',
      title: 'User Management',
      description: 'Manage staff accounts, roles, and access permissions.',
      href: '/admin/users',
      roles: ['owner'],
    },
  ]

  const visibleTools = tools.filter((t) => t.roles.includes(role))

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar title="Dashboard" />

        <main className="flex-1 p-6 md:p-8">
          {/* Greeting */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              Welcome back, {firstName} 👋
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-slate-500 text-sm">Your role:</span>
              {role && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-700'}`}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </div>
          </div>

          {/* Tools grid */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Your Tools
            </h3>
            {visibleTools.length === 0 ? (
              <p className="text-slate-500 text-sm">No tools available for your role yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleTools.map((tool) => (
                  <ToolCard key={tool.href} {...tool} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
