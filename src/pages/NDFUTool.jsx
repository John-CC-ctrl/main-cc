import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { calcNDFU } from '../utils/ndfuCalc'

// ─── Helpers ─────────────────────────────────────────────────
function fmt(n) {
  return `$${n}`
}

// ─── Sub-components ──────────────────────────────────────────

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

// ─── Section 1 ───────────────────────────────────────────────

function PricingSection({ pricing, sqft, setSqft, recurSel, setRecurSel, pacSel, setPacSel }) {
  const pac = pricing?.pac[pacSel]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <h2 className="text-base font-semibold text-slate-700">Property &amp; Pricing</h2>

      {/* Square footage input */}
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
          {/* Standard clean reference */}
          <div className="text-sm text-slate-500">
            Standard Clean (one-time):&nbsp;
            <span className="font-semibold text-slate-700">
              {fmt(pricing.stdLo)} – {fmt(pricing.stdHi)}
            </span>
            <span className="ml-2 text-xs text-slate-400">
              ({pricing.stdHrsLo}–{pricing.stdHrsHi} hrs)
            </span>
          </div>

          {/* Whole-home recurring cards */}
          <div>
            <div className="text-sm font-medium text-slate-600 mb-2">Whole Home Recurring</div>
            <div className="flex gap-3">
              <RecurringCard
                label="Weekly"
                price={pricing.weeklyPx}
                selected={recurSel === 'weekly'}
                onClick={() => setRecurSel('weekly')}
              />
              <RecurringCard
                label="Bi-Weekly"
                price={pricing.biweeklyPx}
                selected={recurSel === 'biweekly'}
                onClick={() => setRecurSel('biweekly')}
              />
              <RecurringCard
                label="Monthly"
                price={pricing.monthlyPx}
                selected={recurSel === 'monthly'}
                onClick={() => setRecurSel('monthly')}
              />
            </div>
          </div>

          {/* Priority Area Clean */}
          <div>
            <div className="text-sm font-medium text-slate-600 mb-2">Priority Area Clean (PAC)</div>
            <div className="flex gap-2 mb-4">
              {['A', 'B', 'C'].map((opt) => (
                <PacToggle
                  key={opt}
                  label={`Option ${opt} — ${pricing.pac[opt].hrs} hrs`}
                  selected={pacSel === opt}
                  onClick={() => setPacSel(opt)}
                />
              ))}
            </div>

            {pac && (
              <div className="flex gap-3">
                <RecurringCard
                  label="Weekly"
                  price={pac.weekly}
                  selected={false}
                  onClick={() => {}}
                />
                <RecurringCard
                  label="Bi-Weekly"
                  price={pac.biweekly}
                  selected={false}
                  onClick={() => {}}
                />
                <RecurringCard
                  label="Monthly"
                  price={pac.monthly}
                  selected={false}
                  onClick={() => {}}
                />
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

      {!pricing && sqft && Number(sqft) > 0 && (
        <p className="text-sm text-red-500">Enter a valid square footage above.</p>
      )}
    </div>
  )
}

// ─── Section 2 ───────────────────────────────────────────────

const ADDON_OPTIONS = ['Oven Cleaning', 'Inside Fridge', 'Inside Windows']

function OfferCard({ id, title, subtitle, activeOffer, setActiveOffer, children }) {
  const isChecked = activeOffer === id
  const isDisabled = activeOffer !== null && !isChecked

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-colors ${
        isChecked
          ? 'border-blue-500 bg-blue-50'
          : isDisabled
          ? 'border-slate-200 bg-slate-50 opacity-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
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
        One-Click Offers —{' '}
        <span className="font-normal text-slate-500">Same-Call Booking Tools</span>
      </h2>

      <OfferCard
        id="savings100"
        title="$100 Recurring Sign-Up Savings"
        subtitle="Spread across your first five recurring visits."
        activeOffer={activeOffer}
        setActiveOffer={setActiveOffer}
      >
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>$25 off your 2nd recurring visit</li>
          <li>$25 off your 4th recurring visit</li>
          <li>$50 off your 5th recurring visit</li>
        </ul>
        <div className="text-xs text-blue-600 font-medium mt-2">Total: $100 in savings</div>
      </OfferCard>

      <OfferCard
        id="pkg3"
        title="3 Clean Package — $75 savings"
        subtitle="$25 off each of your next 3 standard cleans."
        activeOffer={activeOffer}
        setActiveOffer={setActiveOffer}
      >
        <p className="text-sm text-blue-700">
          Client is not signing up for recurring. We will schedule 3 cleans and follow up after
          the 3rd.
        </p>
      </OfferCard>

      <OfferCard
        id="freeAddon"
        title="Free Add-On with Recurring Sign-Up"
        subtitle="Client picks one add-on service, applied on any visit they choose."
        activeOffer={activeOffer}
        setActiveOffer={setActiveOffer}
      >
        <div>
          <label className="block text-xs font-medium text-blue-700 mb-1">Select add-on:</label>
          <select
            value={addonChoice}
            onChange={(e) => setAddonChoice(e.target.value)}
            className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ADDON_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <p className="text-xs text-blue-600 mt-1.5">Applied on any visit the client chooses.</p>
        </div>
      </OfferCard>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────

export default function NDFUTool() {
  const [sqft, setSqft]           = useState('')
  const [recurSel, setRecurSel]   = useState('biweekly')
  const [pacSel, setPacSel]       = useState('B')
  const [activeOffer, setActiveOffer] = useState(null)
  const [addonChoice, setAddonChoice] = useState(ADDON_OPTIONS[0])

  const pricing = calcNDFU(sqft)

  const handleStartOver = () => {
    setSqft('')
    setRecurSel('biweekly')
    setPacSel('B')
    setActiveOffer(null)
    setAddonChoice(ADDON_OPTIONS[0])
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <TopBar title="NDFU Sales Call Tool" />
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
          </div>
        </main>
      </div>
    </div>
  )
}
