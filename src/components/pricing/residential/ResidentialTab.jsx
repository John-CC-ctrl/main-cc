import { useCalc } from '../../../context/CalculatorContext'
import RatesPanel         from './RatesPanel'
import ServiceCards       from './ServiceCards'
import PriorityAreaClean  from './PriorityAreaClean'
import AddOns             from './AddOns'
import RecurringRates     from './RecurringRates'
import DownsellPath       from './DownsellPath'
import OneClickOffers     from './OneClickOffers'
import QuoteSummary       from './QuoteSummary'

export default function ResidentialTab() {
  const { sqft, setSqft, level, setLevel, lastCalc } = useCalc()

  return (
    <div>
      {/* ── Inputs ── */}
      <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm p-5 mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-4">Property Details</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Square footage */}
          <div>
            <label className="block text-sm font-semibold text-gray-cc-500 mb-1.5">
              Total Square Footage
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 2500"
              value={sqft || ''}
              onChange={e => setSqft(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-gray-cc-200 rounded-lg text-sm focus:outline-none focus:border-navy-light bg-white"
            />
          </div>

          {/* Cleanliness level */}
          <div>
            <label className="block text-sm font-semibold text-gray-cc-500 mb-1.5">
              Cleanliness Level:{' '}
              <span className="text-navy font-black">{level}</span>
              {' '}—{' '}
              <span className="text-gray-cc-400 font-normal">{levelLabel(level)}</span>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-cc-400 font-medium">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={level}
                onChange={e => setLevel(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-cc-400 font-medium">10</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-cc-400 mt-1 px-4">
              <span>Very Dirty</span>
              <span>Average</span>
              <span>Pristine</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notices ── */}
      {lastCalc?.isSmall && (
        <div className="bg-orange-cc-bg border border-orange-cc/30 rounded-xl px-4 py-3 text-sm text-orange-cc font-medium mb-4">
          ⚠️ Small property — under 1,000 sq ft minimums apply.
          Standard Clean: min 2.5 hrs · Deep/Moving: min 5 hrs
        </div>
      )}
      {level <= 2 && lastCalc && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium mb-4">
          🚫 Dirt levels 1–2: Standard Clean is unavailable. Deluxe Clean required.
        </div>
      )}
      {lastCalc?.isMaintained && (
        <div className="bg-green-cc-bg border border-green-cc/30 rounded-xl px-4 py-3 text-sm text-green-cc font-medium mb-4">
          ✨ Maintained Home Discount applied — all initial clean estimates reduced by 0.5 hr.
        </div>
      )}

      {/* ── Rates panel ── */}
      <RatesPanel />

      {/* ── Service cards (Cards 1–4) ── */}
      <ServiceCards />

      {/* ── Priority Area Clean (Card 5) ── */}
      <PriorityAreaClean />

      {/* ── Add-ons ── */}
      <AddOns />

      {/* ── Recurring rates ── */}
      <RecurringRates />

      {/* ── Sales path ── */}
      <DownsellPath />

      {/* ── 1-Click Offers ── */}
      <OneClickOffers />

      {/* ── Quote Summary / Receipt ── */}
      <QuoteSummary />
    </div>
  )
}

function levelLabel(l) {
  if (l <= 2) return 'Very Dirty — Deluxe Clean Required'
  if (l <= 4) return 'Below Average'
  if (l <= 6) return 'Average Condition'
  if (l <= 8) return 'Above Average'
  if (l === 9) return 'Well Maintained'
  return 'Pristine — Maintained Home'
}
