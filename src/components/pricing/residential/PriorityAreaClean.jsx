import { useCalc } from '../../../context/CalculatorContext'
import { fmt, fmtH, fmtRange } from '../../../utils/pricingCalc'

export default function PriorityAreaClean() {
  const {
    lastCalc,
    selectedService, selectService,
    priorityOpt, setPriorityOpt,
    rates,
  } = useCalc()

  if (!lastCalc) return null

  const { priRemoved, pacOpts, pacPrice, selectedPacHrs, isMaintained } = lastCalc

  // Hide card — replace with notice
  if (priRemoved) {
    return (
      <div className="mb-4 bg-blue-cc-bg border border-navy/20 rounded-xl px-4 py-3 text-sm text-navy-mid font-medium">
        ℹ️ Full home clean recommended at this size. Priority Area Clean is not available.
      </div>
    )
  }

  const selected = selectedService === 'priority'

  const optionKeys = ['A', 'B', 'C']

  return (
    <div className="mb-4">
      <div
        onClick={() => selectService('priority')}
        className={[
          'relative rounded-xl border-2 p-4 transition-all cursor-pointer select-none',
          selected
            ? 'border-navy bg-blue-cc-sel shadow-md'
            : 'border-gray-cc-200 bg-white hover:border-navy-light hover:shadow-sm',
        ].join(' ')}
      >
        {selected && (
          <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-navy rounded-full flex items-center justify-center">
            <span className="text-white text-[9px]">✓</span>
          </span>
        )}

        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400">
              Priority Area Clean — High-Traffic Zones Only
            </p>
            <p className="text-[11px] text-gray-cc-400 italic mt-0.5">
              Focuses on highest-traffic areas. Does not cover full home.
            </p>
          </div>
          {isMaintained && (
            <span className="inline-flex items-center gap-1 bg-green-cc-bg text-green-cc text-[11px] font-bold px-2 py-0.5 rounded-full">
              ✨ Maintained Home Discount
            </span>
          )}
        </div>

        {pacPrice && (
          <>
            <p className="text-navy font-black text-xl leading-tight">{fmt(pacPrice.lo)}</p>
            <p className="text-gray-cc-400 text-xs mt-0.5">{selectedPacHrs !== null ? fmtH(selectedPacHrs) : '—'}</p>
          </>
        )}

        {/* Hour option buttons */}
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          {optionKeys.map(key => {
            const hrs = pacOpts[key]
            if (hrs === null) {
              return (
                <button
                  key={key}
                  disabled
                  className="flex-1 py-2 rounded-lg border border-gray-cc-200 bg-gray-cc-50 text-gray-cc-400 text-xs cursor-not-allowed opacity-40"
                >
                  —
                </button>
              )
            }
            const price = fmt(hrs * rates.pac)
            const isActive = priorityOpt === key
            return (
              <button
                key={key}
                onClick={() => setPriorityOpt(key)}
                className={[
                  'flex-1 py-2 rounded-lg border text-xs font-semibold transition-all leading-snug',
                  isActive
                    ? 'border-navy bg-navy text-white shadow-sm'
                    : 'border-gray-cc-200 bg-white text-gray-cc-700 hover:border-navy-light',
                ].join(' ')}
              >
                {fmtH(hrs)}
                <br />
                {price}
              </button>
            )
          })}
        </div>

        <p className="text-[11px] text-gray-cc-400 mt-2">
          Note: 1-Click Offers do not apply to Priority Area Clean or its recurring rates.
        </p>
      </div>
    </div>
  )
}
