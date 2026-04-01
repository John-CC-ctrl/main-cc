import { useCalc } from '../../../context/CalculatorContext'
import { fmt, fmtRange } from '../../../utils/pricingCalc'

function Step({ num, label, price, note }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </div>
      <div className="flex-1 pb-3">
        <p className="text-sm font-semibold text-gray-cc-700">{label}</p>
        {price && <p className="text-navy font-bold text-base leading-tight mt-0.5">{price}</p>}
        {note  && <p className="text-gray-cc-400 text-xs mt-0.5">{note}</p>}
      </div>
    </div>
  )
}

export default function DownsellPath() {
  const { lastCalc } = useCalc()

  if (!lastCalc) {
    return (
      <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm p-5 mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-2">Sales Path Guide</p>
        <p className="text-sm text-gray-cc-400">Enter square footage to see the sales path.</p>
      </div>
    )
  }

  const { deluxePrice, stdPrice, pacPrice, priRemoved, moRec, bwRec, wkRec } = lastCalc

  return (
    <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm p-5 mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-4">Sales Path Guide</p>

      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-3.5 top-7 bottom-7 w-px bg-gray-cc-200" />

        <div className="space-y-0">
          <Step
            num="1"
            label="Lead with Deluxe Clean Upgrade"
            price={fmtRange(deluxePrice.lo, deluxePrice.hi)}
          />

          <div className="ml-10 text-xs text-gray-cc-400 pb-2 -mt-1">↓ If declined…</div>

          <Step
            num="2"
            label="Offer Standard Clean"
            price={fmtRange(stdPrice.lo, stdPrice.hi)}
          />

          <div className="ml-10 text-xs text-gray-cc-400 pb-2 -mt-1">↓ If declined…</div>

          <Step
            num="3"
            label="Offer Priority Area Clean"
            price={
              priRemoved || !pacPrice
                ? undefined
                : fmt(pacPrice.lo)
            }
            note={priRemoved || !pacPrice ? 'Not available at this property size.' : undefined}
          />

          <div className="ml-10 text-xs text-gray-cc-400 pb-2 -mt-1">↓ For recurring service…</div>

          <Step
            num="4"
            label="Recurring: open Monthly → pitch Bi-Weekly → pitch Weekly"
            price={`${fmt(moRec)} · ${fmt(bwRec)} · ${fmt(wkRec)}`}
          />
        </div>
      </div>
    </div>
  )
}
