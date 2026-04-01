import { useCalc } from '../../../context/CalculatorContext'
import { fmt } from '../../../utils/pricingCalc'

const FREQ_OPTIONS = [
  { id: 'monthly',  label: 'Monthly',    note: 'Once a month'   },
  { id: 'biweekly', label: 'Bi-Weekly',  note: 'Every 2 weeks'  },
  { id: 'weekly',   label: 'Weekly',     note: 'Every week'     },
]

export default function RecurringRates() {
  const { lastCalc, selectedFreq, setSelectedFreq } = useCalc()

  if (!lastCalc) return null

  const { moRec, bwRec, wkRec } = lastCalc
  const prices = { monthly: moRec, biweekly: bwRec, weekly: wkRec }

  return (
    <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm p-5 mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-3">
        Recurring Service Rate — After First Clean
      </p>

      <div className="grid grid-cols-3 gap-3">
        {FREQ_OPTIONS.map(({ id, label, note }) => {
          const selected = selectedFreq === id
          return (
            <button
              key={id}
              onClick={() => setSelectedFreq(id)}
              className={[
                'rounded-xl border-2 p-3 text-center transition-all',
                selected
                  ? 'border-navy bg-blue-cc-sel shadow-sm'
                  : 'border-gray-cc-200 bg-white hover:border-navy-light',
              ].join(' ')}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-1">{label}</p>
              <p className="text-navy font-black text-xl leading-tight">{fmt(prices[id])}</p>
              <p className="text-gray-cc-400 text-xs mt-0.5">{note}</p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-cc-400 mt-3">
        Recurring rates reflect ongoing maintenance pricing after the initial clean.
      </p>
    </div>
  )
}
