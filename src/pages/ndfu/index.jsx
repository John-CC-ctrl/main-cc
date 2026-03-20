import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import AddClientModal from './AddClientModal'
import CallScreen from './CallScreen'

// ─── Helpers ────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtExpiry(ts) {
  if (!ts) return null
  const diff = new Date(ts) - new Date()
  if (diff <= 0) return { label: 'Expired', urgent: true }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return { label: `${h}h ${m}m`, urgent: h < 12 }
}
function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

// ─── Badge configs ───────────────────────────────────────────
const STATUS_CFG = {
  pending:        { label: 'Pending',        cls: 'bg-slate-100 text-slate-600' },
  reached:        { label: 'Reached',        cls: 'bg-teal-100 text-teal-700' },
  voicemail:      { label: 'Voicemail',      cls: 'bg-yellow-100 text-yellow-800' },
  no_answer:      { label: 'No Answer',      cls: 'bg-orange-100 text-orange-800' },
  converted:      { label: 'Converted',      cls: 'bg-green-100 text-green-800' },
  not_interested: { label: 'Not Interested', cls: 'bg-red-100 text-red-700' },
  callback:       { label: 'Callback',       cls: 'bg-blue-100 text-blue-800' },
}
const STAGE_CFG = {
  ndfu1:       { label: 'NDFU1',       cls: 'bg-purple-100 text-purple-800' },
  ndfu1_offer: { label: 'NDFU1 Offer', cls: 'bg-indigo-100 text-indigo-800' },
  ndfu2:       { label: 'NDFU2',       cls: 'bg-cyan-100 text-cyan-800' },
  complete:    { label: 'Complete',    cls: 'bg-slate-100 text-slate-600' },
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>
}
function StageBadge({ stage }) {
  const c = STAGE_CFG[stage] || { label: stage, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>
}

// ─── Main Page ───────────────────────────────────────────────
export default function NDFU() {
  const { firstName } = useAuth()
  const [clients, setClients]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedClient, setSelected]   = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [stageFilter, setStageFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]             = useState('')
  const [now, setNow]                   = useState(new Date())

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('ndfu_clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setClients(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  if (selectedClient) {
    return (
      <CallScreen
        client={selectedClient}
        firstName={firstName}
        onBack={() => { setSelected(null); fetchClients() }}
      />
    )
  }

  // ── Stats ──────────────────────────────────────────────────
  const total = clients.length
  const convertedToday = clients.filter(c => c.ndfu_status === 'converted' && isToday(c.updated_at)).length
  const pendingCalls = clients.filter(c => ['pending','callback','no_answer'].includes(c.ndfu_status)).length
  const reached = clients.filter(c => ['reached','converted','not_interested'].includes(c.ndfu_status)).length
  const converted = clients.filter(c => c.ndfu_status === 'converted').length
  const convRate = reached > 0 ? Math.round((converted / reached) * 100) : 0

  // ── Filters ────────────────────────────────────────────────
  const filtered = clients.filter(c => {
    if (stageFilter !== 'all' && c.ndfu_stage !== stageFilter) return false
    if (statusFilter === 'needs_callback' && !['callback','no_answer'].includes(c.ndfu_status)) return false
    else if (statusFilter !== 'all' && statusFilter !== 'needs_callback' && c.ndfu_status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${c.first_name} ${c.last_name}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar title="NDFU Dashboard" />

        <main className="flex-1 p-6 md:p-8 space-y-6">

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total in Pipeline', value: total, color: 'text-slate-800' },
              { label: 'Converted Today',   value: convertedToday, color: 'text-green-600' },
              { label: 'Pending Calls',      value: pendingCalls, color: 'text-amber-600' },
              { label: 'Conversion Rate',    value: `${convRate}%`, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters + Add button */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap items-center">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search client name…"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Stages</option>
                <option value="ndfu1">NDFU1</option>
                <option value="ndfu1_offer">NDFU1 Offer</option>
                <option value="ndfu2">NDFU2</option>
                <option value="complete">Complete</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="needs_callback">Needs Callback</option>
                <option value="converted">Converted</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-navy hover:bg-navy-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              + Add Client
            </button>
          </div>

          {/* Client table */}
          {loading ? (
            <div className="text-center text-slate-400 py-16">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-16">No clients match the current filters.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Client</th>
                      <th className="text-left px-4 py-3">Service</th>
                      <th className="text-left px-4 py-3">Cleaner</th>
                      <th className="text-left px-4 py-3">Stage</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Expiry</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const expiry = c.ndfu_stage === 'ndfu1_offer' ? fmtExpiry(c.offer_expiry) : null
                      return (
                        <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {c.first_name} {c.last_name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div>{c.service_type}</div>
                            <div className="text-xs text-slate-400">{fmtDate(c.service_date)}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{c.cleaner_name || '—'}</td>
                          <td className="px-4 py-3"><StageBadge stage={c.ndfu_stage} /></td>
                          <td className="px-4 py-3"><StatusBadge status={c.ndfu_status} /></td>
                          <td className="px-4 py-3">
                            {expiry ? (
                              <span className={`text-xs font-semibold ${expiry.urgent ? 'text-red-600' : 'text-amber-600'}`}>
                                {expiry.label}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelected(c)}
                              className="bg-navy hover:bg-navy-light text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Start Call
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdded={(newClient) => {
            setClients(prev => [newClient, ...prev])
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}
