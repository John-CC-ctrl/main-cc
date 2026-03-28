import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { calcNDFU } from '../utils/ndfuCalc'
import { useAuth } from '../context/AuthContext'

// ─── Helpers ─────────────────────────────────────────────────
function fmt(n) { return `$${n}` }

/**
 * Render a script string, highlighting [PLACEHOLDER] tokens.
 * subs: { '[YOUR NAME]': 'John', '[STD LO]': '$157', ... }
 * Auto-filled values (present in subs) show their value; others show the raw bracket text.
 * All are bold + soft-yellow so they stand out.
 */
function renderScript(text, subs = {}) {
  const parts = text.split(/(\[[^\]]+\])/g)
  return parts.map((part, i) => {
    if (/^\[[^\]]+\]$/.test(part)) {
      const val = subs[part]
      return (
        <strong key={i} className="bg-yellow-100 text-yellow-800 font-bold px-0.5 rounded">
          {val != null ? val : part}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ─── Shared UI ───────────────────────────────────────────────

/** Italic off-white card with left navy border */
function ScriptBlock({ text, subs }) {
  return (
    <div className="border-l-4 border-navy bg-slate-50 px-4 py-3 italic text-sm text-slate-700 leading-relaxed rounded-r-lg">
      {renderScript(text, subs)}
    </div>
  )
}

function CollapsibleCard({ title, open, onToggle, badge, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{badge}</span>
          )}
        </div>
        <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  )
}

function FlowBtn({ color = 'slate', onClick, children }) {
  const colors = {
    green:  'bg-green-600 hover:bg-green-700 text-white',
    red:    'bg-red-600   hover:bg-red-700   text-white',
    blue:   'bg-blue-600  hover:bg-blue-700  text-white',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    slate:  'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300',
  }
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  )
}

// ─── Voicemail scripts (raw templates — [YOUR NAME] auto-filled on copy) ─────

const VM_SCRIPTS = {
  standard: {
    label: 'Standard VM',
    voice: `Hi [CLIENT FIRST NAME], it's [YOUR NAME] from Cobalt Clean. I hope you're loving your freshly cleaned space! I'm reaching out to hear how you're feeling about the [SERVICE TYPE] we did on [SERVICE DATE]. We always aim to exceed expectations and I'd love to know if we hit the mark. I also have your reduced recurring rates available — just give me a call or text back at this number and I'll check in again tomorrow. Thanks [CLIENT FIRST NAME]!`,
    sms:   `Hi [CLIENT FIRST NAME], I hope you're enjoying your freshly cleaned home! I'd love to hear how you're feeling about the [SERVICE TYPE] on [SERVICE DATE]. Many clients find that regular cleanings help maintain that 'just cleaned' feeling. Here are your special recurring rates:\n\nWeekly: [WEEKLY RATE]\nBi-Weekly: [BI-WEEKLY RATE] ⭐ Most Popular\nMonthly: [MONTHLY RATE]\n\nWould you be interested in setting up recurring cleanings?`,
  },
  offer: {
    label: 'Offer VM',
    voice: `Hi [CLIENT FIRST NAME], this is [YOUR NAME] with Cobalt Clean reaching out a second time. I have an exclusive offer available for you in case you're still interested in ongoing services for your home. It expires on [OFFER EXPIRY DATE] and is your best opportunity to save while getting 5-star cleans on an ongoing basis. I look forward to hearing from you — have a wonderful rest of your day!`,
    sms:   `Hi [CLIENT FIRST NAME], it's [YOUR NAME] with Cobalt Clean. Just checking in — we have a special offer for ongoing service:\n• $25 off your 2nd & 4th recurring visit\n• $50 off your 5th recurring visit\n\nThis offer expires on [OFFER EXPIRY DATE].\n\nYour rates:\nWeekly: [WEEKLY RATE]\nBi-Weekly: [BI-WEEKLY RATE]\nMonthly: [MONTHLY RATE]\n\nDoes that sound like something you'd want to set up?`,
  },
  moveout: {
    label: 'Move-Out VM',
    voice: `Hi [CLIENT FIRST NAME], I tried to reach you by phone — just following up to make sure everything went smoothly and to answer any questions. I also noticed you moved out — are you moving into another home in Las Vegas? If so, I'd love to quote you and apply a returning-client discount. Looking forward to hearing from you!`,
    sms:   `Hi [CLIENT FIRST NAME], I tried to reach you by phone. Just following up to make sure everything went smoothly and to answer any questions. Are you moving to another home in Las Vegas? If so, I'd love to offer you a quote with a returning client discount. Looking forward to hearing from you!`,
  },
}

// ─── Section 1 ───────────────────────────────────────────────

function RecurringCard({ label, price, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl border-2 px-4 py-3 text-center transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold">{fmt(price)}</div>
      <div className="text-xs mt-0.5 opacity-70">per visit</div>
    </button>
  )
}

function PacToggle({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
        selected
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
      }`}
    >
      {label}
    </button>
  )
}

function PricingSection({ pricing, sqft, setSqft, recurSel, setRecurSel, pacSel, setPacSel }) {
  const pac = pricing?.pac[pacSel]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <h2 className="text-base font-semibold text-slate-700">Property &amp; Pricing</h2>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Square Footage</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 1800"
          value={sqft}
          onChange={(e) => setSqft(e.target.value)}
          className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {pricing && (
        <>
          <div className="text-sm text-slate-500">
            Standard Clean (one-time):&nbsp;
            <span className="font-semibold text-slate-700">
              {fmt(pricing.stdLo)} – {fmt(pricing.stdHi)}
            </span>
            <span className="ml-2 text-xs text-slate-400">
              ({pricing.stdHrsLo}–{pricing.stdHrsHi} hrs)
            </span>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-600 mb-2">Whole Home Recurring</div>
            <div className="flex gap-3">
              <RecurringCard label="Weekly"    price={pricing.weeklyPx}   selected={recurSel === 'weekly'}   onClick={() => setRecurSel('weekly')}   />
              <RecurringCard label="Bi-Weekly" price={pricing.biweeklyPx} selected={recurSel === 'biweekly'} onClick={() => setRecurSel('biweekly')} />
              <RecurringCard label="Monthly"   price={pricing.monthlyPx}  selected={recurSel === 'monthly'}  onClick={() => setRecurSel('monthly')}  />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-slate-600 mb-2">Priority Area Clean (PAC)</div>
            <div className="flex gap-2 mb-4">
              {['A', 'B', 'C'].map((opt) => (
                <PacToggle key={opt} label={`Option ${opt} — ${pricing.pac[opt].hrs} hrs`} selected={pacSel === opt} onClick={() => setPacSel(opt)} />
              ))}
            </div>
            {pac && (
              <div className="flex gap-3">
                <RecurringCard label="Weekly"    price={pac.weekly}   selected={false} onClick={() => {}} />
                <RecurringCard label="Bi-Weekly" price={pac.biweekly} selected={false} onClick={() => {}} />
                <RecurringCard label="Monthly"   price={pac.monthly}  selected={false} onClick={() => {}} />
                <div className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-center">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">One-Time</div>
                  <div className="text-2xl font-bold text-slate-700">{fmt(pac.price)}</div>
                  <div className="text-xs mt-0.5 text-slate-400">{pac.hrs} hrs</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Section 2 ───────────────────────────────────────────────

const ADDON_OPTIONS = ['Oven Cleaning', 'Inside Fridge', 'Inside Windows']

const FREQ_LABELS = { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly' }

const OFFER_NAMES = {
  savings100: '$100 Recurring Sign-Up Savings',
  pkg3:       '3 Clean Package — $75 savings',
  freeAddon:  'Free Add-On with Recurring Sign-Up',
}

function OfferCard({ id, title, subtitle, activeOffer, setActiveOffer, children }) {
  const isChecked  = activeOffer === id
  const isDisabled = activeOffer !== null && !isChecked
  return (
    <div className={`rounded-xl border-2 p-4 transition-colors ${isChecked ? 'border-blue-500 bg-blue-50' : isDisabled ? 'border-slate-200 bg-slate-50 opacity-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <label className={`flex items-start gap-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          className="mt-0.5 w-4 h-4 accent-blue-600"
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => setActiveOffer(isChecked ? null : id)}
        />
        <div className="flex-1">
          <div className="font-semibold text-sm text-slate-800">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
          {isChecked && <div className="mt-3">{children}</div>}
        </div>
      </label>
    </div>
  )
}

function OffersSection({ activeOffer, setActiveOffer, addonChoice, setAddonChoice }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      <h2 className="text-base font-semibold text-slate-700">
        One-Click Offers — <span className="font-normal text-slate-500">Same-Call Booking Tools</span>
      </h2>

      <OfferCard id="savings100" title="$100 Recurring Sign-Up Savings" subtitle="Spread across your first five recurring visits." activeOffer={activeOffer} setActiveOffer={setActiveOffer}>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>$25 off your 2nd recurring visit</li>
          <li>$25 off your 4th recurring visit</li>
          <li>$50 off your 5th recurring visit</li>
        </ul>
        <div className="text-xs text-blue-600 font-medium mt-2">Total: $100 in savings</div>
      </OfferCard>

      <OfferCard id="pkg3" title="3 Clean Package — $75 savings" subtitle="$25 off each of your next 3 standard cleans." activeOffer={activeOffer} setActiveOffer={setActiveOffer}>
        <p className="text-sm text-blue-700">Client is not signing up for recurring. We will schedule 3 cleans and follow up after the 3rd.</p>
      </OfferCard>

      <OfferCard id="freeAddon" title="Free Add-On with Recurring Sign-Up" subtitle="Client picks one add-on service, applied on any visit they choose." activeOffer={activeOffer} setActiveOffer={setActiveOffer}>
        <div>
          <label className="block text-xs font-medium text-blue-700 mb-1">Select add-on:</label>
          <select
            value={addonChoice}
            onChange={(e) => setAddonChoice(e.target.value)}
            className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ADDON_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <p className="text-xs text-blue-600 mt-1.5">Applied on any visit the client chooses.</p>
        </div>
      </OfferCard>
    </div>
  )
}

// ─── Section 3 — Call Script ─────────────────────────────────

function ScriptSection({ pricing, pacSel, firstName, toast, showToast }) {
  // Phase controls which parts of the script are revealed
  const [phase, setPhase] = useState('opening')
  // 'opening' | 'negative' | 'positive' | 'objection' | 'not_interested' | 'pac_interested'

  // Independent collapsible state for each card
  const [open, setOpen] = useState({
    opening:   true,
    voicemail: false,
    pitch:     false,
    objection: false,
    review:    false,
  })
  const toggle = (key) => setOpen((p) => ({ ...p, [key]: !p[key] }))

  const pac     = pricing?.pac[pacSel]
  const subs    = {
    '[YOUR NAME]':  firstName,
    '[STD LO]':     pricing ? fmt(pricing.stdLo)    : null,
    '[STD HI]':     pricing ? fmt(pricing.stdHi)    : null,
    '[WEEKLY]':     pricing ? fmt(pricing.weeklyPx)   : null,
    '[BI-WEEKLY]':  pricing ? fmt(pricing.biweeklyPx) : null,
    '[MONTHLY]':    pricing ? fmt(pricing.monthlyPx)  : null,
    '[PAC PRICE]':  pac     ? fmt(pac.price)         : null,
  }

  const handlePositive = () => {
    setPhase('positive')
    setOpen((p) => ({ ...p, pitch: true }))
  }
  const handleNegative = () => setPhase('negative')
  const handleInterested = () => setPhase('interested')
  const handlePriceObjection = () => {
    setPhase('objection')
    setOpen((p) => ({ ...p, objection: true }))
  }
  const handleNotInterested = () => {
    setPhase('not_interested')
    setOpen((p) => ({ ...p, review: true }))
  }
  const handlePacInterested = () => setPhase('pac_interested')
  const handleStillNotInterested = () => {
    setPhase('still_not_interested')
    setOpen((p) => ({ ...p, review: true }))
  }

  const copyReviewLink = async () => {
    await navigator.clipboard.writeText('https://g.page/r/CX1Udtdr1PK2EAI/review').catch(() => {})
    showToast('Review link copied!')
  }

  const copySms = async (text) => {
    const filled = text.replace(/\[YOUR NAME\]/g, firstName || '[YOUR NAME]')
    await navigator.clipboard.writeText(filled).catch(() => {})
    showToast('SMS template copied!')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-700 px-1">Call Script</h2>

      {/* ── Opening ── */}
      <CollapsibleCard title="Opening" open={open.opening} onToggle={() => toggle('opening')}>
        <ScriptBlock
          text={`"Good morning/afternoon [CLIENT NAME], it's [YOUR NAME] with Cobalt Clean — how are you doing today?" (pause) "Awesome! Just reaching out about the [SERVICE TYPE] we completed on [DATE]. How did everything go?"`}
          subs={subs}
        />

        {phase === 'opening' && (
          <div className="flex gap-3 flex-wrap">
            <FlowBtn color="green" onClick={handlePositive}>Positive Feedback</FlowBtn>
            <FlowBtn color="red"   onClick={handleNegative}>Negative Feedback</FlowBtn>
          </div>
        )}

        {phase === 'negative' && (
          <div className="space-y-3">
            <ScriptBlock
              text={`"I'm really sorry to hear that — your satisfaction is our top priority. Let me get all the details so we can address this properly for you."`}
              subs={subs}
            />
            <a
              href="https://airtable.com/appdypHnRxexsUsnt/shrc6wCXQpr0AMjAq"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Open Complaint Form ↗
            </a>
          </div>
        )}

        {phase !== 'opening' && phase !== 'negative' && (
          <div className="space-y-3">
            <ScriptBlock
              text={`"That's wonderful to hear! What would you say was the best part of the service?"`}
              subs={subs}
            />
            <p className="text-xs text-green-600 font-medium">✓ Positive — pitch card opened below</p>
          </div>
        )}
      </CollapsibleCard>

      {/* ── Pitch ── */}
      {(phase === 'positive' || phase === 'objection' || phase === 'not_interested' || phase === 'still_not_interested' || phase === 'interested' || phase === 'pac_interested') && (
        <CollapsibleCard title="Recurring Pitch" open={open.pitch} onToggle={() => toggle('pitch')}>
          <ScriptBlock
            text={`"So for your next cleaning, I can get you in at the same day and time slot — is it going to be weekly or every other week?"`}
            subs={subs}
          />

          {/* Inline pricing reference */}
          {pricing ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
              <div className="grid grid-cols-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2 border-b border-slate-200">
                <span>Frequency</span><span>Price / visit</span>
              </div>
              {[
                { label: 'Weekly',    price: pricing.weeklyPx },
                { label: 'Bi-Weekly', price: pricing.biweeklyPx, star: true },
                { label: 'Monthly',   price: pricing.monthlyPx },
              ].map((r) => (
                <div key={r.label} className={`grid grid-cols-2 px-4 py-3 border-b border-slate-100 last:border-0 ${r.star ? 'bg-blue-50' : ''}`}>
                  <span className="font-medium text-slate-800">{r.label}{r.star ? ' ⭐' : ''}</span>
                  <span className="text-slate-700">{fmt(r.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Enter sqft above to show pricing</p>
          )}

          <ScriptBlock
            text={`"On a non-regular basis this would normally be [STD LO]–[STD HI]. Bi-weekly is only [BI-WEEKLY] per visit."`}
            subs={subs}
          />

          {phase === 'positive' && (
            <div className="flex gap-3 flex-wrap">
              <FlowBtn color="green"  onClick={handleInterested}>Interested in Recurring</FlowBtn>
              <FlowBtn color="yellow" onClick={handlePriceObjection}>Price Objection</FlowBtn>
              <FlowBtn color="slate"  onClick={handleNotInterested}>Not Interested</FlowBtn>
            </div>
          )}
          {phase === 'interested' && (
            <p className="text-xs text-green-600 font-medium">✓ Client interested in recurring — proceed with booking</p>
          )}
        </CollapsibleCard>
      )}

      {/* ── PAC Downsell ── */}
      {(phase === 'objection' || phase === 'pac_interested' || phase === 'still_not_interested') && (
        <CollapsibleCard title="Price Objection / PAC Downsell" open={open.objection} onToggle={() => toggle('objection')}>
          <ScriptBlock
            text={`"I completely understand. What if we focused on just your highest-traffic areas — kitchen and bathrooms? We can do that for just [PAC PRICE]. Great way to stay maintained without the full home commitment."`}
            subs={subs}
          />

          {/* PAC options inline */}
          {pricing ? (
            <div className="grid grid-cols-3 gap-3 text-sm">
              {(['A', 'B', 'C']).map((opt) => {
                const p = pricing.pac[opt]
                return (
                  <div key={opt} className={`rounded-xl border-2 px-3 py-3 text-center ${pacSel === opt ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Option {opt}</div>
                    <div className="text-lg font-bold text-slate-800">{fmt(p.price)}</div>
                    <div className="text-xs text-slate-400">{p.hrs} hrs</div>
                    <div className="text-xs text-slate-500 mt-1">Bi-wkly {fmt(p.biweekly)}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Enter sqft above to show PAC pricing</p>
          )}

          {phase === 'objection' && (
            <div className="flex gap-3 flex-wrap">
              <FlowBtn color="green" onClick={handlePacInterested}>Interested in PAC</FlowBtn>
              <FlowBtn color="slate" onClick={handleStillNotInterested}>Still Not Interested</FlowBtn>
            </div>
          )}
          {phase === 'pac_interested' && (
            <p className="text-xs text-green-600 font-medium">✓ Client interested in PAC — proceed with booking</p>
          )}
        </CollapsibleCard>
      )}

      {/* ── Review Ask ── */}
      {(phase === 'not_interested' || phase === 'still_not_interested') && (
        <CollapsibleCard title="Review Ask" open={open.review} onToggle={() => toggle('review')}>
          <ScriptBlock
            text={`"I completely understand. By the way, if you have a moment, we'd love a review — your cleaner actually gets a tip in your name at no cost to you. Can I send you a text link?"`}
            subs={subs}
          />
          <FlowBtn color="blue" onClick={copyReviewLink}>Copy Review Link</FlowBtn>
        </CollapsibleCard>
      )}

      {/* ── Voicemail Scripts ── */}
      <CollapsibleCard title="Voicemail Scripts" open={open.voicemail} onToggle={() => toggle('voicemail')}>
        <div className="space-y-5">
          {Object.entries(VM_SCRIPTS).map(([key, vm]) => (
            <div key={key} className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">{vm.label}</h4>
              <ScriptBlock text={vm.voice} subs={subs} />
              <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">SMS Template</div>
                {vm.sms}
              </div>
              <FlowBtn color="slate" onClick={() => copySms(vm.sms)}>Copy SMS</FlowBtn>
            </div>
          ))}
        </div>
      </CollapsibleCard>
    </div>
  )
}

// ─── Section 4 — Call Notes ──────────────────────────────────

function NotesSection({ notes, setNotes }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-700 mb-3">Call Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        placeholder="Type notes here as the call progresses — client preferences, feedback, objections, special instructions, pricing discussed..."
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
      />
    </div>
  )
}

// ─── Section 5 — Quote Summary ───────────────────────────────

function QuoteSummarySection({
  pricing, recurSel, pacSel,
  quoteServiceType, setQuoteServiceType,
  activeOffer, setShowBooking, setBookingType,
}) {
  const whPriceMap = {
    weekly:   pricing?.weeklyPx,
    biweekly: pricing?.biweeklyPx,
    monthly:  pricing?.monthlyPx,
  }
  const pacPriceMap = {
    weekly:   pricing?.pac[pacSel]?.weekly,
    biweekly: pricing?.pac[pacSel]?.biweekly,
    monthly:  pricing?.pac[pacSel]?.monthly,
  }

  const serviceLabel = !pricing
    ? 'None selected'
    : quoteServiceType === 'pac'
      ? 'Priority Area Clean'
      : 'Whole Home'

  const pricePerVisit = !pricing
    ? null
    : quoteServiceType === 'pac'
      ? pacPriceMap[recurSel]
      : whPriceMap[recurSel]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-700">Quote Summary</h2>
        {/* Service type toggle */}
        {pricing && (
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setQuoteServiceType('whole_home')}
              className={`px-3 py-1.5 transition-colors ${quoteServiceType === 'whole_home' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Whole Home
            </button>
            <button
              onClick={() => setQuoteServiceType('pac')}
              className={`px-3 py-1.5 transition-colors ${quoteServiceType === 'pac' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              PAC
            </button>
          </div>
        )}
      </div>

      {/* Receipt rows */}
      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-sm">
        <div className="flex justify-between px-4 py-3">
          <span className="text-slate-500">Service Type</span>
          <span className="font-medium text-slate-800">{serviceLabel}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-slate-500">Frequency</span>
          <span className="font-medium text-slate-800">{FREQ_LABELS[recurSel]}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-slate-500">Price per visit</span>
          <span className="font-semibold text-slate-900 text-base">
            {pricePerVisit != null ? fmt(pricePerVisit) : '—'}
          </span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-slate-500">Active offer</span>
          <span className="font-medium text-slate-800">
            {activeOffer ? OFFER_NAMES[activeOffer] : 'None'}
          </span>
        </div>
        {pricing && (
          <div className="flex justify-between px-4 py-3 bg-slate-50 rounded-b-xl">
            <span className="text-slate-400 text-xs">Standard clean (non-recurring)</span>
            <span className="text-slate-500 text-xs font-medium">
              {fmt(pricing.stdLo)} – {fmt(pricing.stdHi)}
            </span>
          </div>
        )}
      </div>

      {/* Booking buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { setShowBooking(true); setBookingType('recurring') }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Client is Booking Recurring ✓
        </button>
        {activeOffer === 'pkg3' && (
          <button
            onClick={() => { setShowBooking(true); setBookingType('3pack') }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            3 Clean Package Selected
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────

export default function NDFUTool() {
  const { firstName } = useAuth()

  const [sqft, setSqft]               = useState('')
  const [recurSel, setRecurSel]       = useState('biweekly')
  const [pacSel, setPacSel]           = useState('B')
  const [activeOffer, setActiveOffer] = useState(null)
  const [addonChoice, setAddonChoice] = useState(ADDON_OPTIONS[0])
  const [callNotes, setCallNotes]     = useState('')
  const [toast, setToast]             = useState(null)

  const [quoteServiceType, setQuoteServiceType] = useState('whole_home')
  const [showBooking, setShowBooking]           = useState(false)
  const [bookingType, setBookingType]           = useState(null)

  // Section 3 needs its own phase/open state — reset by remounting via key
  const [scriptKey, setScriptKey]     = useState(0)

  const pricing = calcNDFU(sqft)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleStartOver = () => {
    setSqft('')
    setRecurSel('biweekly')
    setPacSel('B')
    setActiveOffer(null)
    setAddonChoice(ADDON_OPTIONS[0])
    setCallNotes('')
    setQuoteServiceType('whole_home')
    setShowBooking(false)
    setBookingType(null)
    setScriptKey((k) => k + 1)
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <TopBar title="NDFU Sales Call Tool" />

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg pointer-events-none">
            {toast}
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-800">NDFU Sales Call Tool</h1>
            <button
              onClick={handleStartOver}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Call / Start Over
            </button>
          </div>

          <div className="space-y-6 max-w-3xl">
            <PricingSection
              pricing={pricing}
              sqft={sqft}
              setSqft={setSqft}
              recurSel={recurSel}
              setRecurSel={setRecurSel}
              pacSel={pacSel}
              setPacSel={setPacSel}
            />
            <OffersSection
              activeOffer={activeOffer}
              setActiveOffer={setActiveOffer}
              addonChoice={addonChoice}
              setAddonChoice={setAddonChoice}
            />
            <QuoteSummarySection
              pricing={pricing}
              recurSel={recurSel}
              pacSel={pacSel}
              quoteServiceType={quoteServiceType}
              setQuoteServiceType={setQuoteServiceType}
              activeOffer={activeOffer}
              setShowBooking={setShowBooking}
              setBookingType={setBookingType}
            />

            {showBooking && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-sm text-slate-600">
                Booking form coming next step.
              </div>
            )}

            <ScriptSection
              key={scriptKey}
              pricing={pricing}
              pacSel={pacSel}
              firstName={firstName}
              toast={toast}
              showToast={showToast}
            />
            <NotesSection notes={callNotes} setNotes={setCallNotes} />
          </div>
        </main>
      </div>
    </div>
  )
}
