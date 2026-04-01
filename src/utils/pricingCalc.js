// ─── Speed interpolation ──────────────────────────────────────────────────────
// Piecewise-linear between (1→lo), (5→mid), (10→hi)
export function interpolateSpeed(level, lo, mid, hi) {
  if (level <= 5) return lo + (mid - lo) * (level - 1) / 4
  return mid + (hi - mid) * (level - 5) / 5
}

// ─── Labor hour rounding ──────────────────────────────────────────────────────
// .1/.2/.3 → floor | .4/.5/.6/.7 → floor+0.5 | .8/.9 → ceil
export function pricingRoundHours(h) {
  if (h <= 0) return 0
  const f = Math.floor(h)
  const d = h - f
  if (d < 0.4) return f
  if (d < 0.8) return f + 0.5
  return f + 1
}

// ─── Attractive-digit rounding ────────────────────────────────────────────────
// All final prices must end in 2, 7, or 9
export function pricingRoundToAttractive(n) {
  if (n <= 0) return 0
  const b = Math.floor(n / 10) * 10
  // Candidates: prev-decade's 9, this decade's 2/7/9, next decade's 2
  const candidates = [b - 1, b + 2, b + 7, b + 9, b + 12].filter(x => x >= 0)
  return candidates.reduce((best, x) =>
    Math.abs(x - n) < Math.abs(best - n) ? x : best
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmt(n) {
  return '$' + Math.max(0, Math.round(n)).toLocaleString()
}

export function fmtRange(lo, hi) {
  return `${fmt(lo)} – ${fmt(hi)}`
}

export function fmtH(h) {
  return h === 1 ? '1 hr' : `${h} hrs`
}

export function fmtHrsRange(lo, hi) {
  if (lo === hi) return fmtH(lo)
  return `${fmtH(lo)} – ${fmtH(hi)}`
}
