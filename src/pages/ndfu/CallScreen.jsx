import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'

// ─── Helpers ────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtMoney(n) { return n != null ? `$${Number(n).toFixed(0)}` : '—' }
function fmtExpiry(ts) {
  if (!ts) return null
  const diff = new Date(ts) - new Date()
  if (diff <= 0) return { label: 'Expired', urgent: true }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return { label: `${h}h ${m}m`, urgent: h < 12 }
}
function fill(template, client, firstName) {
  const offerExpiry = client.offer_expiry
    ? new Date(client.offer_expiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : '[OFFER EXPIRY DATE]'
  return template
    .replace(/\[CLIENT FIRST NAME\]/g, client.first_name || '')
    .replace(/\[YOUR NAME\]/g, firstName || '')
    .replace(/\[SERVICE TYPE\]/g, client.service_type || '')
    .replace(/\[SERVICE DATE\]/g, fmtDate(client.service_date))
    .replace(/\[CLEANER NAME\]/g, client.cleaner_name || '')
    .replace(/\[OFFER EXPIRY DATE\]/g, offerExpiry)
    .replace(/\[recurring_weekly\]/g, fmtMoney(client.recurring_weekly))
    .replace(/\[recurring_biweekly\]/g, fmtMoney(client.recurring_biweekly))
    .replace(/\[recurring_monthly\]/g, fmtMoney(client.recurring_monthly))
    .replace(/\[PRICE PAID\]/g, fmtMoney(client.price_paid))
}

// ─── Sub-components ──────────────────────────────────────────
function ScriptCard({ children }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 italic text-slate-700 text-sm leading-relaxed">
      {children}
    </div>
  )
}
function SectionCard({ title, children, visible }) {
  if (!visible) return null
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  )
}
function Btn({ onClick, color = 'slate', children, disabled }) {
  const colors = {
    green:  'bg-green-600 hover:bg-green-700 text-white',
    red:    'bg-red-600 hover:bg-red-700 text-white',
    blue:   'bg-blue-600 hover:bg-blue-700 text-white',
    navy:   'bg-navy hover:bg-navy-light text-white',
    slate:  'bg-slate-100 hover:bg-slate-200 text-slate-700',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${colors[color]}`}
    >
      {children}
    </button>
  )
}

// ─── Voicemail Section ───────────────────────────────────────
const VM_SCRIPTS = {
  standard: {
    label: 'Standard VM (NDFU1)',
    voice: `Hi [CLIENT FIRST NAME], it's [YOUR NAME] from Cobalt Clean. I hope you're loving your freshly cleaned space! I'm reaching out to hear how you're feeling about the [SERVICE TYPE] we did on [SERVICE DATE]. We always aim to exceed expectations and I'd love to know if we hit the mark. I also have your reduced recurring rates available now that the first clean is complete. Just give me a call or text back at this number — I'll check in again tomorrow. Thanks [CLIENT FIRST NAME]!`,
    text:  `Hi [CLIENT FIRST NAME], I hope you're enjoying your freshly cleaned home! I'd love to hear how you're feeling about the [SERVICE TYPE] on [SERVICE DATE]. Many of our clients find that regular cleanings help maintain that 'just cleaned' feeling. As a thank you for trusting us with your home, here are your special recurring rates:\n\nWeekly: [recurring_weekly]\nBi-Weekly: [recurring_biweekly] ⭐ Most Popular\nMonthly: [recurring_monthly]\n\nCompared to your one-time [SERVICE TYPE] of [PRICE PAID]. Would you be interested in setting up recurring cleanings?`,
  },
  offer: {
    label: 'NDFU1 Offer VM',
    voice: `Hi [CLIENT FIRST NAME], this is [YOUR NAME] with Cobalt Clean reaching out a second time. I have an exclusive offer available for you in case you're still interested in ongoing services for your home. It expires on [OFFER EXPIRY DATE] and is your best opportunity to save while getting 5-star cleans on an ongoing basis. I look forward to hearing from you — have a wonderful rest of your day!`,
    text:  `Hi [CLIENT FIRST NAME], it's [YOUR NAME] with Cobalt Clean. Just checking in — we have a special offer available for ongoing service. For a limited time, get additional savings when you sign up:\n• $25 off your 2nd & 4th recurring service\n• $50 off your 5th recurring service\n\nThis offer expires on [OFFER EXPIRY DATE].\n\nYour rates:\nWeekly: [recurring_weekly]\nBi-Weekly: [recurring_biweekly]\nMonthly: [recurring_monthly]\n\nDoes that sound like something you'd want to set up?`,
  },
  moveout: {
    label: 'Move-Out VM',
    voice: `Hi [CLIENT FIRST NAME], I tried to reach you by phone — just following up to make sure everything went smoothly and to answer any questions you might have. I also noticed you moved out — are you moving into another home in Las Vegas? If so, I'd love to quote you and apply a discount since you've worked with us before. Looking forward to hearing from you!`,
    text:  `Hi [CLIENT FIRST NAME], I tried to reach you by phone. Just following up to make sure everything went smoothly and answer any questions. I noticed you moved out — are you moving to another home in Las Vegas? If so, I'd love to offer you a quote with a returning client discount. Looking forward to hearing from you!`,
  },
}

const STAGE_NEXT = { ndfu1: 'ndfu1_offer', ndfu1_offer: 'ndfu2', ndfu2: 'complete' }
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Main CallScreen ─────────────────────────────────────────
export default function CallScreen({ client: initialClient, firstName, onBack }) {
  const [client, setClient] = useState(initialClient)
  const [phase, setPhase] = useState('opening')
  // opening | voicemail | feedback | pitch | downsell | signup | review | done
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [now, setNow] = useState(new Date())

  // Form fields
  const [callNotes, setCallNotes]   = useState(client.call_notes || '')
  const [feedback, setFeedback]     = useState(client.feedback || '')
  const [bestPart, setBestPart]     = useState(client.best_part || '')
  const [freq, setFreq]             = useState(client.frequency_selected || '')
  const [days, setDays]             = useState(() => (client.preferred_days || '').split(',').filter(Boolean))
  const [time, setTime]             = useState(client.preferred_times || '')
  const [prefCleaner, setPrefCleaner] = useState(client.preferred_cleaner || client.cleaner_name || '')
  const [otherPrefs, setOtherPrefs] = useState(client.other_preferences || '')
  const [referral, setReferral]     = useState(client.referral_mentioned || false)
  const [checklist, setChecklist]   = useState({
    l27notes: false, custProfile: false, recurring: false, team: false, metrics: false,
  })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const save = useCallback(async (patch) => {
    setSaving(true)
    const { data, error } = await supabase
      .from('ndfu_clients').update(patch).eq('id', client.id).select().single()
    setSaving(false)
    if (!error && data) setClient(data)
    return { data, error }
  }, [client.id])

  const expiry = fmtExpiry(client.offer_expiry)
  const f = (t) => fill(t, client, firstName)

  // ── Actions ────────────────────────────────────────────────
  const handleLiveAnswer = () => {
    save({ ndfu_status: 'reached' })
    setPhase('feedback')
  }
  const handleNoAnswer = () => {
    save({ ndfu_status: 'no_answer' })
    setPhase('voicemail')
  }
  const handlePositive = () => setPhase('pitch')
  const handleNegative = () => {
    save({ ndfu_status: 'not_interested', ndfu_stage: 'complete' })
    setPhase('done_complaint')
  }
  const handleInterested = () => setPhase('signup')
  const handlePriceObjection = () => setPhase('downsell')
  const handleNotInterested = () => setPhase('review')
  const handleDownsellYes = () => setPhase('signup')
  const handleStillNotInterested = () => setPhase('review')

  const handleVoicemailLeft = async (vmType) => {
    const nextStage = STAGE_NEXT[client.ndfu_stage] || 'complete'
    const patch = {
      ndfu_status: 'voicemail',
      ndfu_stage: nextStage,
    }
    if (vmType === 'offer' || client.ndfu_stage === 'ndfu1') {
      patch.offer_expiry = new Date(Date.now() + 72 * 3600 * 1000).toISOString()
    }
    await save(patch)
    setPhase('voicemail_sent')
  }

  const handleConvert = async () => {
    await save({
      ndfu_status: 'converted',
      ndfu_stage: 'complete',
      interested_in_recurring: true,
      frequency_selected: freq,
      preferred_days: days.join(','),
      preferred_times: time,
      preferred_cleaner: prefCleaner,
      other_preferences: otherPrefs,
      referral_mentioned: referral,
      feedback,
      best_part: bestPart,
      call_notes: callNotes,
    })
    showToast('Marked as Converted!')
    setTimeout(onBack, 1500)
  }

  const handleSendReviewLink = async () => {
    await navigator.clipboard.writeText('https://g.page/r/CX1Udtdr1PK2EAI/review').catch(() => {})
    await save({ review_link_sent: true, ndfu_status: 'not_interested', ndfu_stage: 'complete', feedback, call_notes: callNotes })
    showToast('Review link copied to clipboard!')
  }

  const handleSaveReturn = async () => {
    await save({ feedback, best_part: bestPart, call_notes: callNotes })
    onBack()
  }

  const copyText = async (text) => {
    await navigator.clipboard.writeText(f(text)).catch(() => {})
    showToast('Copied to clipboard!')
  }

  const checklistDone = Object.values(checklist).every(Boolean)

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-navy text-white px-6 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <button onClick={handleSaveReturn} className="text-slate-300 hover:text-white text-sm mb-4 flex items-center gap-1">
            ← Back to list
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {client.first_name} {client.last_name}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-slate-300 text-sm">{client.phone}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(client.phone || ''); showToast('Copied!') }}
                  className="text-xs bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="mt-2 text-slate-300 text-sm space-y-0.5">
                <div>{client.service_type} · {fmtDate(client.service_date)} · {fmtMoney(client.price_paid)}</div>
                {client.cleaner_name && <div>Cleaner: {client.cleaner_name}</div>}
                {client.job_notes && <div className="text-slate-400 italic text-xs mt-1">{client.job_notes}</div>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StageBadge stage={client.ndfu_stage} />
              {client.ndfu_stage === 'ndfu1_offer' && expiry && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${expiry.urgent ? 'bg-red-600 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                  ⏱ Offer expires: {expiry.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Call flow */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Call notes always visible */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Call Notes</label>
          <textarea
            value={callNotes}
            onChange={e => setCallNotes(e.target.value)}
            rows={2}
            placeholder="Notes during this call…"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* ── Section 1: Opening ── */}
        <SectionCard title="1 — Opening" visible>
          <ScriptCard>
            {client.ndfu_stage === 'ndfu1' ? f(
              `"Good morning/afternoon [CLIENT FIRST NAME], it's [YOUR NAME] with Cobalt Clean — how are you doing today?" (pause) "Awesome! I'm just reaching out about the [SERVICE TYPE] we completed on [SERVICE DATE]. How did everything go? Did you get what you needed?"`
            ) : f(
              `"Hi [CLIENT FIRST NAME], this is [YOUR NAME] from Cobalt Clean — I know life can get busy, so I've put together a special package for maintenance cleanings just for you. It's designed to give you a taste of how we can help bring more balance to your life. Would you like to hear about it?"`
            )}
          </ScriptCard>
          {(phase === 'opening') && (
            <div className="flex gap-3 flex-wrap">
              <Btn color="green" onClick={handleLiveAnswer}>✓ Live Answer</Btn>
              <Btn color="yellow" onClick={handleNoAnswer}>📵 No Answer / Voicemail</Btn>
            </div>
          )}
          {phase !== 'opening' && phase !== 'voicemail' && phase !== 'voicemail_sent' && (
            <p className="text-xs text-green-600 font-medium">✓ Live answer — proceeding with call</p>
          )}
        </SectionCard>

        {/* ── Voicemail Section ── */}
        {(phase === 'voicemail' || phase === 'voicemail_sent') && (
          <SectionCard title="Voicemail Scripts" visible>
            {Object.entries(VM_SCRIPTS).map(([key, vm]) => (
              <div key={key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">{vm.label}</h4>
                <ScriptCard>{f(vm.voice)}</ScriptCard>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 whitespace-pre-line">
                  {f(vm.text)}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Btn color="slate" onClick={() => copyText(vm.text)}>📋 Copy Text</Btn>
                  {phase === 'voicemail' && (
                    <Btn color="navy" onClick={() => handleVoicemailLeft(key)}>✓ Left This VM</Btn>
                  )}
                </div>
              </div>
            ))}
            {phase === 'voicemail_sent' && (
              <div className="flex gap-3">
                <p className="text-xs text-green-600 font-medium flex-1">✓ Voicemail logged — stage advanced</p>
                <Btn color="slate" onClick={handleSaveReturn}>Save & Return to List</Btn>
              </div>
            )}
          </SectionCard>
        )}

        {/* ── Section 2: Feedback ── */}
        <SectionCard title="2 — Feedback Collection" visible={['feedback','pitch','downsell','signup','review','done_complaint'].includes(phase)}>
          <p className="text-xs text-slate-500 italic">(Listen and write feedback below)</p>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            placeholder="Client feedback…"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {phase === 'feedback' && (
            <div className="flex gap-3 flex-wrap">
              <Btn color="green" onClick={handlePositive}>👍 Positive Feedback</Btn>
              <Btn color="red" onClick={handleNegative}>👎 Negative Feedback</Btn>
            </div>
          )}
          {['pitch','downsell','signup','review'].includes(phase) && (
            <>
              <ScriptCard>
                {f(`"That's wonderful to hear! I'm so glad [CLEANER NAME] was able to bring some extra peace and comfort to your home. Your feedback means a lot to us." "What would you say was the best part of the service?"`)}
              </ScriptCard>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Best part of service</label>
                <input
                  value={bestPart}
                  onChange={e => setBestPart(e.target.value)}
                  placeholder="Client response…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          {phase === 'done_complaint' && (
            <>
              <ScriptCard>
                {`"I'm really sorry to hear that. It's not our intention and your satisfaction is our top priority. Let me get all the details so we can address this properly for you."`}
              </ScriptCard>
              <div className="flex gap-3 flex-wrap">
                <a
                  href="https://airtable.com/appdypHnRxexsUsnt/shrc6wCXQpr0AMjAq"
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Open Complaint Form ↗
                </a>
                <Btn color="slate" onClick={handleSaveReturn}>Save & Return</Btn>
              </div>
            </>
          )}
        </SectionCard>

        {/* ── Section 3: Recurring Pitch ── */}
        <SectionCard title="3 — Recurring Pitch" visible={['pitch','downsell','signup','review'].includes(phase)}>
          <ScriptCard>
            {`"So for your next cleaning, I can get you in at the same day and time slot — is it going to be weekly or every other week?"`}
          </ScriptCard>

          {/* Price comparison */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2 border-b border-slate-200">
              <span>Frequency</span><span>Price</span><span>Label</span>
            </div>
            {[
              { freq: 'Weekly', val: client.recurring_weekly, label: '' },
              { freq: 'Bi-Weekly', val: client.recurring_biweekly, label: '⭐ Most Popular' },
              { freq: 'Monthly', val: client.recurring_monthly, label: '' },
            ].map(r => (
              <div key={r.freq} className={`grid grid-cols-3 px-4 py-3 text-sm border-b border-slate-100 last:border-0 ${r.label ? 'bg-blue-50' : ''}`}>
                <span className="font-medium text-slate-800">{r.freq}</span>
                <span className="text-slate-700">{fmtMoney(r.val)}</span>
                <span className="text-blue-600 font-medium text-xs">{r.label}</span>
              </div>
            ))}
          </div>

          <ScriptCard>
            {f(`"On a non-regular basis, this would normally be between $${client.price_paid ? Math.floor(client.price_paid * 0.9) : '—'} and [PRICE PAID]. When you go bi-weekly it's only [recurring_biweekly] each visit."`)}
          </ScriptCard>

          {phase === 'pitch' && (
            <div className="flex gap-3 flex-wrap">
              <Btn color="green" onClick={handleInterested}>✓ Interested in Recurring</Btn>
              <Btn color="yellow" onClick={handlePriceObjection}>💬 Price Objection</Btn>
              <Btn color="slate" onClick={handleNotInterested}>✗ Not Interested</Btn>
            </div>
          )}
        </SectionCard>

        {/* Downsell */}
        <SectionCard title="3b — Priority Area Downsell" visible={['downsell','signup'].includes(phase)}>
          <ScriptCard>
            {`"I completely understand. What if we focused on just your highest-traffic areas — kitchen and bathrooms — to keep those maintained? We can do that at a reduced rate. It's a great way to keep the most important spaces fresh without the full home commitment."`}
          </ScriptCard>
          {phase === 'downsell' && (
            <div className="flex gap-3 flex-wrap">
              <Btn color="green" onClick={handleDownsellYes}>✓ Interested in Priority Area</Btn>
              <Btn color="slate" onClick={handleStillNotInterested}>✗ Still Not Interested</Btn>
            </div>
          )}
        </SectionCard>

        {/* ── Section 4: Sign Up ── */}
        <SectionCard title="4 — Sign Up Flow" visible={phase === 'signup'}>
          <ScriptCard>
            {`"Fantastic! I'll get you set up right now. I just need a few quick details to make sure we serve you perfectly."`}
          </ScriptCard>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
              <select value={freq} onChange={e => setFreq(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select…</option>
                {['Weekly','Bi-Weekly','Monthly'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Time</label>
              <select value={time} onChange={e => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select…</option>
                {['Morning','Afternoon','Evening'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Preferred Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={days.includes(d)}
                    onChange={e => setDays(prev => e.target.checked ? [...prev, d] : prev.filter(x => x !== d))}
                    className="rounded" />
                  <span className="text-sm text-slate-700">{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Cleaner</label>
              <input value={prefCleaner} onChange={e => setPrefCleaner(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Other Preferences</label>
              <input value={otherPrefs} onChange={e => setOtherPrefs(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Referral */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <ScriptCard>
              {`"Did you know we offer a free cleaning for any referrals you send our way who sign up for recurring service? It's our way of saying thank you!"`}
            </ScriptCard>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={referral} onChange={e => setReferral(e.target.checked)} className="rounded" />
              <span className="text-sm text-slate-700">Referral offer mentioned</span>
            </label>
          </div>

          {/* Pre-conversion checklist */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Pre-Conversion Checklist</p>
            {[
              ['l27notes',    'L27 recurring notes updated'],
              ['custProfile', 'Customer profile notes added in L27'],
              ['recurring',   'Recurring appointments confirmed and double-checked'],
              ['team',        'Team acknowledged'],
              ['metrics',     'Performance metrics updated'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist[key]}
                  onChange={e => setChecklist(c => ({ ...c, [key]: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          <Btn color="green" onClick={handleConvert} disabled={!checklistDone || saving}>
            {saving ? 'Saving…' : '🎉 Mark as Converted'}
          </Btn>
          {!checklistDone && (
            <p className="text-xs text-amber-600">Complete all checklist items to enable conversion.</p>
          )}
        </SectionCard>

        {/* ── Section 5: Review Ask ── */}
        <SectionCard title="5 — Review Ask" visible={phase === 'review'}>
          <ScriptCard>
            {f(`"I completely understand — every home has different needs. By the way, if you have a moment, we'd love if you could share your experience in a review. It's a great way to give [CLEANER NAME] an extra thank-you for their hard work — she'll actually get a tip in your name, at no cost to you. Can I send you a text link for that?"`)}
          </ScriptCard>
          <div className="flex gap-3 flex-wrap">
            <Btn color="blue" onClick={handleSendReviewLink}>
              📋 Send Review Link
            </Btn>
            <Btn color="slate" onClick={handleSaveReturn}>Save & Return</Btn>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function StageBadge({ stage }) {
  const MAP = {
    ndfu1:       ['NDFU1',       'bg-purple-100 text-purple-800'],
    ndfu1_offer: ['NDFU1 Offer', 'bg-indigo-100 text-indigo-800'],
    ndfu2:       ['NDFU2',       'bg-cyan-100 text-cyan-800'],
    complete:    ['Complete',    'bg-slate-100 text-slate-600'],
  }
  const [label, cls] = MAP[stage] || ['—', 'bg-slate-100 text-slate-600']
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
}
