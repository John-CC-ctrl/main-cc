import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const SERVICE_TYPES = ['Deep Clean', 'Standard Clean', 'Move-Out Clean', 'Priority Area Clean']

const EMPTY = {
  first_name: '', last_name: '', phone: '', email: '',
  service_type: 'Standard Clean', service_date: '',
  cleaner_name: '', price_paid: '', recurring_weekly: '',
  recurring_biweekly: '', recurring_monthly: '', job_notes: '',
}

export default function AddClientModal({ onClose, onAdded }) {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data, error: err } = await supabase.from('ndfu_clients').insert({
      ...form,
      price_paid:         form.price_paid         ? parseFloat(form.price_paid)         : null,
      recurring_weekly:   form.recurring_weekly   ? parseFloat(form.recurring_weekly)   : null,
      recurring_biweekly: form.recurring_biweekly ? parseFloat(form.recurring_biweekly) : null,
      recurring_monthly:  form.recurring_monthly  ? parseFloat(form.recurring_monthly)  : null,
      service_date:       form.service_date || null,
      ndfu_stage:   'ndfu1',
      ndfu_status:  'pending',
      created_by:   user?.id ?? null,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onAdded(data)
  }

  const Field = ({ label, name, type = 'text', required }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => set(name, e.target.value)}
        required={required}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Add Client to NDFU Pipeline</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" name="first_name" required />
            <Field label="Last Name" name="last_name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" name="phone" type="tel" required />
            <Field label="Email" name="email" type="email" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Service Type *</label>
              <select
                value={form.service_type}
                onChange={e => set('service_type', e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Service Date" name="service_date" type="date" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cleaner Name" name="cleaner_name" />
            <Field label="Price Paid ($)" name="price_paid" type="number" required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Weekly Rate ($)" name="recurring_weekly" type="number" />
            <Field label="Bi-Weekly Rate ($)" name="recurring_biweekly" type="number" />
            <Field label="Monthly Rate ($)" name="recurring_monthly" type="number" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Job Notes</label>
            <textarea
              value={form.job_notes}
              onChange={e => set('job_notes', e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-navy text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
