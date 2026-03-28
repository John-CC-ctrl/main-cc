// ─── Pricing constants ───────────────────────────────────────
const STD_RATE = 52    // $/hr Standard Clean
const PAC_RATE = 55    // $/hr Priority Area Clean
const SPEED_LO = 450   // sqft/hr (slower — used for high-end hours)
const SPEED_HI = 500   // sqft/hr (faster — used for low-end hours)
const BUFFER   = 0.5   // hr added to every job

// ─── Helpers ─────────────────────────────────────────────────

/** Round up to nearest 0.5 */
export function roundHours(h) {
  return Math.ceil(h * 2) / 2
}

/**
 * Round a price up to the nearest number ending in 7, 9, or 2.
 * e.g.  85 → 87,  88 → 89,  100 → 102,  137.5 → 139
 */
export function roundToAttractive(rawPrice) {
  const price = Math.ceil(rawPrice)
  const ones  = price % 10
  // Next attractive digit at or above `ones`
  for (const d of [2, 7, 9]) {
    if (d >= ones) return Math.floor(price / 10) * 10 + d
  }
  // ones > 9 can't happen, but safety: roll into next decade ending in 2
  return (Math.floor(price / 10) + 1) * 10 + 2
}

// ─── Main calculation ─────────────────────────────────────────

/**
 * Compute all pricing from square footage.
 * Returns null when sqft is falsy / non-positive.
 */
export function calcPricing(sqft) {
  const s = Number(sqft)
  if (!s || s <= 0) return null

  // Hours range (dirt level 5 = average = no multiplier)
  const hrsLo = roundHours(s / SPEED_HI + BUFFER)  // faster speed → fewer hrs → lower price
  const hrsHi = roundHours(s / SPEED_LO + BUFFER)  // slower speed → more hrs → higher price

  // Standard clean price range
  const stdLo = hrsLo * STD_RATE
  const stdHi = hrsHi * STD_RATE

  // Whole-home recurring rates (derived from stdLo)
  let monthlyPx, biweeklyPx, weeklyPx
  const monthlyRaw = roundToAttractive(stdLo - 30)
  if (monthlyRaw >= stdLo) {
    // Degenerate case (very small home): flat $10 steps
    monthlyPx   = stdLo - 10
    biweeklyPx  = stdLo - 20
    weeklyPx    = stdLo - 30
  } else {
    monthlyPx   = monthlyRaw
    biweeklyPx  = roundToAttractive(monthlyPx - 12)
    weeklyPx    = roundToAttractive(biweeklyPx - 18)
  }

  // Priority Area Clean options
  const pacDefaultHrs = Math.max(hrsLo - 1, 2)
  const pacHrs = {
    A: Math.max(pacDefaultHrs - 0.5, 2),
    B: pacDefaultHrs,
    C: pacDefaultHrs + 0.5,
  }

  const buildPac = (hrs) => {
    const price    = roundToAttractive(hrs * PAC_RATE)
    const monthly  = price - 2
    const biweekly = monthly - 3
    const weekly   = biweekly - 5
    return { hrs, price, monthly, biweekly, weekly }
  }

  return {
    sqft: s,
    hrsLo, hrsHi,
    stdLo, stdHi,
    weeklyPx, biweeklyPx, monthlyPx,
    pac: {
      A: { ...buildPac(pacHrs.A), valid: pacHrs.A < hrsLo },
      B: { ...buildPac(pacHrs.B), valid: true },
      C: { ...buildPac(pacHrs.C), valid: pacHrs.C < hrsLo },
    },
  }
}
