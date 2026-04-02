import { useCalc } from '../../../context/CalculatorContext'
import { fmt, fmtRange, fmtHrsRange } from '../../../utils/pricingCalc'

const SERVICE_NAMES = {
  deep:     'Regular Deep Clean',
  deluxe:   'Deluxe Clean Upgrade',
  moving:   'Moving Clean',
  standard: 'Standard Clean (Initial Visit)',
  priority: 'Priority Area Clean',
}

const FREQ_LABELS = {
  monthly:  'Monthly',
  biweekly: 'Bi-Weekly',
  weekly:   'Weekly',
}

const OFFER_LABELS = {
  military:   'Military Discount (−$25)',
  senior:     'Senior Discount (−$15)',
  firsttime:  'First Time Client Credit (−$20)',
  deluxe150:  'Upgrade to Deluxe − $150',
  ff:         'Friend & Family Mode ($35/hr)',
  barter:     'Barter Mode',
  '3pack':    '3 Clean Package Discount',
}

const ADDONS_META = [
  { key: 'oven',    label: 'Oven Cleaning',  price: 59 },
  { key: 'fridge',  label: 'Inside Fridge',  price: 59 },
  { key: 'windows', label: 'Inside Windows', price: 59 },
]

function Row({ label, value, highlight }) {
  return (
    <div className={[
      'flex items-baseline justify-between gap-4 py-2',
      highlight ? 'border-t-2 border-navy pt-3 mt-1' : 'border-b border-gray-cc-50',
    ].join(' ')}>
      <span className="text-xs text-gray-cc-400 font-medium flex-shrink-0">{label}</span>
      <span className={highlight
        ? 'text-navy font-black text-xl text-right'
        : 'text-gray-cc-800 font-semibold text-sm text-right'
      }>
        {value}
      </span>
    </div>
  )
}

export default function QuoteSummary() {
  const {
    lastCalc,
    selectedService, selectedFreq,
    addons, activeOffer,
  } = useCalc()

  if (!lastCalc || !selectedService) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-cc-200 p-6 text-center mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-1">Quote Summary</p>
        <p className="text-sm text-gray-cc-400">Select a service card to generate a quote.</p>
      </div>
    )
  }

  const { decoyPrice, deluxePrice, movingPrice, stdPrice, pacPrice,
          deepLo, deepHi, stdLo, stdHi, selectedPacHrs,
          moRec, bwRec, wkRec } = lastCalc

  // Map service → price + hours
  const priceMap = {
    deep:     { price: decoyPrice,  hrsLo: deepLo,         hrsHi: deepHi         },
    deluxe:   { price: deluxePrice, hrsLo: deepLo,         hrsHi: deepHi         },
    moving:   { price: movingPrice, hrsLo: deepLo,         hrsHi: deepHi         },
    standard: { price: stdPrice,    hrsLo: stdLo,          hrsHi: stdHi          },
    priority: { price: pacPrice,    hrsLo: selectedPacHrs, hrsHi: selectedPacHrs },
  }

  const serviceData = priceMap[selectedService]
  if (!serviceData?.price) return null

  const { price, hrsLo, hrsHi } = serviceData
  const isDeluxe = selectedService === 'deluxe'

  // Add-ons (excluded when Deluxe selected)
  const checkedAddons = isDeluxe
    ? []
    : ADDONS_META.filter(a => addons[a.key])
  const addonTotal = checkedAddons.reduce((sum, a) => sum + a.price, 0)

  // Recurring price
  const recPrices = { monthly: moRec, biweekly: bwRec, weekly: wkRec }
  const recPrice  = recPrices[selectedFreq] ?? bwRec

  // Total due today
  const totalDue = price.lo + addonTotal

  const discountLabel = activeOffer && OFFER_LABELS[activeOffer] && selectedService !== 'priority'
    ? OFFER_LABELS[activeOffer]
    : null

  return (
    <div className="rounded-xl border-2 border-navy bg-white shadow-lg p-5 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b-2 border-navy pb-3 mb-3">
        <span className="text-lg">📋</span>
        <p className="font-black text-gray-cc-800 text-base">Quote Summary</p>
        <span className="ml-auto text-xs text-gray-cc-400">Sales Rep Reference</span>
      </div>

      <Row
        label="Service Type"
        value={SERVICE_NAMES[selectedService] ?? selectedService}
      />
      <Row
        label="Estimated Labor Hours"
        value={hrsLo !== null ? fmtHrsRange(hrsLo, hrsHi) : '—'}
      />
      <Row
        label={discountLabel
          ? `Initial Price Estimate · ${discountLabel}`
          : 'Initial Price Estimate'
        }
        value={fmtRange(price.lo, price.hi)}
      />
      <Row
        label="Add-Ons Selected"
        value={
          isDeluxe
            ? 'All included with Deluxe Clean'
            : checkedAddons.length > 0
              ? checkedAddons.map(a => `${a.label} (${fmt(a.price)})`).join(', ')
              : 'None'
        }
      />
      <Row
        label="Add-On Total"
        value={addonTotal > 0 ? fmt(addonTotal) : '$0'}
      />
      <Row
        label={`Your Maintenance Rate After First Clean (${FREQ_LABELS[selectedFreq]})`}
        value={`${fmt(recPrice)} / visit`}
      />
      <Row
        label="Estimated Total Due Today"
        value={fmt(totalDue)}
        highlight
      />
    </div>
  )
}
