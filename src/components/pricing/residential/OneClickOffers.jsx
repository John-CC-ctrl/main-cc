import { useCalc } from '../../../context/CalculatorContext'

const OFFERS = [
  {
    id: 'military',
    label: 'Military Discount',
    desc: '$25 off all initial clean price quotes',
  },
  {
    id: 'senior',
    label: 'Senior Discount',
    desc: '$15 off all initial clean price quotes',
  },
  {
    id: 'firsttime',
    label: 'First Time Client Credit — $20',
    desc: '$20 off all initial clean price quotes',
  },
  {
    id: 'deluxe150',
    label: 'Upgrade to Deluxe — $150 off with recurring sign-up',
    desc: '$150 off Deluxe Clean Upgrade price only. No effect on other cards.',
  },
  {
    id: 'ff',
    label: 'Friend & Family Mode',
    desc: 'Recalculate all prices at $35/hr. Labor hours unchanged.',
  },
  {
    id: 'barter',
    label: 'Barter Mode (IMS/ITEX)',
    desc: 'Recalculate all prices at the Barter Rate. Labor hours unchanged. Unlocks Barter Rate field.',
  },
  {
    id: '3pack',
    label: '3 Clean Package — Save $75',
    desc: '$25 off each of 3 Standard Cleans. For Deluxe: $50 off each of 3 Deep Cleans.',
    note: 'Client must purchase package now and schedule the next 3 cleans to receive savings.',
  },
]

export default function OneClickOffers() {
  const { activeOffer, toggleOffer } = useCalc()

  return (
    <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm p-5 mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-1">
        1-Click Offers — Urgency &amp; Same-Call Booking Tools
      </p>
      <p className="text-xs text-gray-cc-400 mb-4">
        One offer active at a time. PAC and recurring rates are exempt.
      </p>

      <div className="space-y-0 divide-y divide-gray-cc-50">
        {OFFERS.map(offer => {
          const isActive   = activeOffer === offer.id
          const isDisabled = activeOffer !== null && !isActive

          return (
            <label
              key={offer.id}
              className={[
                'flex items-start gap-3 py-3 cursor-pointer transition-opacity',
                isDisabled ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-cc-50 -mx-2 px-2 rounded',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={isActive}
                disabled={isDisabled}
                onChange={() => toggleOffer(offer.id)}
                className="w-4 h-4 mt-0.5 accent-navy flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-cc-700">{offer.label}</p>
                <p className="text-xs text-gray-cc-400 mt-0.5">{offer.desc}</p>
                {isActive && offer.note && (
                  <p className="mt-2 text-xs font-medium text-orange-cc bg-orange-cc-bg border border-orange-cc/30 rounded-lg px-3 py-2">
                    📋 {offer.note}
                  </p>
                )}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
