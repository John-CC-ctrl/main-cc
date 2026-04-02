import { useCalc } from '../../../context/CalculatorContext'
import { fmt, fmtRange, fmtHrsRange } from '../../../utils/pricingCalc'

// ─── Single service card ──────────────────────────────────────────────────────
function Card({ id, title, subtitle, price, hrsLo, hrsHi, badge, extra, disabled, disabledMsg }) {
  const { selectedService, selectService } = useCalc()
  const selected = selectedService === id && !disabled

  return (
    <div
      onClick={() => !disabled && selectService(id)}
      className={[
        'relative rounded-xl border-2 p-4 transition-all select-none',
        disabled
          ? 'opacity-55 cursor-not-allowed border-gray-cc-200 bg-gray-cc-50'
          : selected
            ? 'border-navy bg-blue-cc-sel shadow-md cursor-pointer'
            : 'border-gray-cc-200 bg-white hover:border-navy-light hover:shadow-sm cursor-pointer',
      ].join(' ')}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-navy rounded-full flex items-center justify-center">
          <span className="text-white text-[9px]">✓</span>
        </span>
      )}

      <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-cc-400 mb-1 italic">{subtitle}</p>}

      {disabled ? (
        <p className="text-xs text-red-600 mt-1">{disabledMsg}</p>
      ) : (
        <>
          <p className="text-navy font-black text-xl leading-tight">{fmtRange(price.lo, price.hi)}</p>
          <p className="text-gray-cc-400 text-xs mt-0.5">{fmtHrsRange(hrsLo, hrsHi)}</p>
        </>
      )}

      {badge && !disabled && <div className="mt-2">{badge}</div>}
      {extra && !disabled && <div className="mt-1">{extra}</div>}
    </div>
  )
}

// ─── Main service cards section ───────────────────────────────────────────────
export default function ServiceCards() {
  const { lastCalc, level, activeOffer } = useCalc()

  if (!lastCalc) {
    return (
      <div className="bg-white rounded-xl border border-gray-cc-200 p-8 text-center text-gray-cc-400 text-sm mb-4">
        Enter square footage above to see pricing options.
      </div>
    )
  }

  const { decoyPrice, deluxePrice, movingPrice, stdPrice, deepLo, deepHi, stdLo, stdHi,
          deluxeSavings, isMaintained, stdDisabled } = lastCalc

  const maintBadge = isMaintained ? (
    <span className="inline-flex items-center gap-1 bg-green-cc-bg text-green-cc text-[11px] font-bold px-2 py-0.5 rounded-full">
      ✨ Maintained Home Discount
    </span>
  ) : null

  const savingsBadge = deluxeSavings > 0 ? (
    <span className="inline-flex items-center gap-1 bg-green-cc-bg text-green-cc text-[11px] font-bold px-2 py-0.5 rounded-full">
      Save {fmt(deluxeSavings)} vs. market rate
    </span>
  ) : null

  const threePackBadge = activeOffer === '3pack' ? (
    <span className="inline-flex items-center bg-blue-cc-bg text-navy text-[11px] font-bold px-2 py-0.5 rounded-full">
      3-Pack Pricing Applied
    </span>
  ) : null

  const deluxe150Badge = activeOffer === 'deluxe150' ? (
    <span className="inline-flex items-center bg-green-cc-bg text-green-cc text-[11px] font-bold px-2 py-0.5 rounded-full">
      −$150 w/ Recurring Sign-up
    </span>
  ) : null

  return (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-3">Service Options</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* Card 1: Regular Deep Clean (Anchor / Decoy) */}
        <Card
          id="deep"
          title="Regular Deep Clean"
          subtitle="Market reference price"
          price={decoyPrice}
          hrsLo={deepLo}
          hrsHi={deepHi}
          badge={maintBadge}
          extra={
            <span className="text-[11px] text-gray-cc-400 italic">
              Standard market rate — for anchoring
            </span>
          }
        />

        {/* Card 2: Deluxe Clean Upgrade */}
        <Card
          id="deluxe"
          title="Book Today — Deluxe Clean Upgrade"
          price={deluxePrice}
          hrsLo={deepLo}
          hrsHi={deepHi}
          badge={maintBadge}
          extra={
            <div className="flex flex-col gap-1">
              {savingsBadge}
              {deluxe150Badge}
              {activeOffer === '3pack' && threePackBadge}
            </div>
          }
        />

        {/* Card 3: Moving Clean */}
        <Card
          id="moving"
          title="Moving Clean"
          price={movingPrice}
          hrsLo={deepLo}
          hrsHi={deepHi}
          badge={maintBadge}
        />

        {/* Card 4: Standard Clean */}
        <Card
          id="standard"
          title="Standard Clean (Initial Visit)"
          price={stdPrice}
          hrsLo={stdLo}
          hrsHi={stdHi}
          badge={
            <div className="flex flex-col gap-1">
              {maintBadge}
              {activeOffer === '3pack' && threePackBadge}
            </div>
          }
          disabled={stdDisabled}
          disabledMsg="Standard Clean unavailable at this dirt level. Deluxe Clean required."
        />
      </div>
    </div>
  )
}
