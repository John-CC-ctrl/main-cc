// ─── Re-use helpers from the existing pricing module ──────────
export { roundHours, roundToAttractive } from '../pages/ndfu/pricing'
import { roundHours, roundToAttractive } from '../pages/ndfu/pricing'

// ─── Constants ────────────────────────────────────────────────
const SPEED    = 475  // sqft/hr — dirt level 5 midpoint (450–500)
const STD_RATE = 52   // $/hr Standard Clean
const PAC_RATE = 55   // $/hr Priority Area Clean

// ─── Main calculation ─────────────────────────────────────────
/**
 * Compute all NDFU tool pricing from square footage.
 * Returns null when sqft is falsy / non-positive.
 */
export function calcNDFU(sqft) {
  const s = Number(sqft)
  if (!s || s <= 0) return null

  // Hours
  const rawLo   = s / SPEED + 0.5
  const stdHrsLo = roundHours(rawLo)
  const stdHrsHi = stdHrsLo + 1

  // Standard clean price range
  const stdLo = roundToAttractive(stdHrsLo * STD_RATE)
  const stdHi = roundToAttractive(stdHrsHi * STD_RATE)

  // Whole-home recurring rates (derived from stdLo)
  let monthlyPx, biweeklyPx, weeklyPx
  const monthlyRaw = roundToAttractive(stdLo - 30)
  if (monthlyRaw >= stdLo) {
    // Degenerate case (very small home)
    monthlyPx  = stdLo - 10
    biweeklyPx = roundToAttractive(monthlyPx - 12)
    weeklyPx   = roundToAttractive(biweeklyPx - 18)
  } else {
    monthlyPx  = monthlyRaw
    biweeklyPx = roundToAttractive(monthlyPx - 12)
    weeklyPx   = roundToAttractive(biweeklyPx - 18)
  }

  // Priority Area Clean options
  const pacDefaultHrs = Math.max(2, stdHrsLo - 1)
  const pacHrsA = Math.max(2, pacDefaultHrs - 0.5)
  const pacHrsB = pacDefaultHrs
  const pacHrsC = Math.min(stdHrsLo - 0.5, pacDefaultHrs + 0.5)

  const buildPac = (hrs) => {
    const price    = roundToAttractive(hrs * PAC_RATE)
    const monthly  = price - 2
    const biweekly = monthly - 3
    const weekly   = biweekly - 5
    return { hrs, price, monthly, biweekly, weekly }
  }

  return {
    sqft: s,
    stdHrsLo, stdHrsHi,
    stdLo, stdHi,
    weeklyPx, biweeklyPx, monthlyPx,
    pac: {
      A: buildPac(pacHrsA),
      B: buildPac(pacHrsB),
      C: buildPac(pacHrsC),
    },
  }
}
