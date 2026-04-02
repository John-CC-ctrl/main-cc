import { useState, useMemo } from 'react'
import { interpolateSpeed, pricingRoundHours, pricingRoundToAttractive } from '../utils/pricingCalc'

// ─── Default state ────────────────────────────────────────────────────────────
const DEFAULT_RATES = {
  decoy:    65,   // Card 1 – Regular Deep Clean anchor (locked)
  deep:     57,   // Cards 2 & 3 – Deluxe / Moving (locked)
  standard: 52,   // Card 4 – Standard Clean (locked)
  pac:      55,   // Card 5 – Priority Area Clean (unlocked, default = std+3)
  monthly:  50,   // Recurring monthly  (unlocked)
  biweekly: 47,   // Recurring bi-weekly (unlocked)
  weekly:   45,   // Recurring weekly   (unlocked)
}

// ─── Core residential calculation ─────────────────────────────────────────────
export function calcResidential(sqft, level, rates, barterRate, activeOffer, selectedService, priorityOpt) {
  if (!sqft || sqft <= 0) return null

  // ── Effective rates based on active offer ──────────────────────────────────
  let decoyR = rates.decoy
  let deepR  = rates.deep     // used for Deluxe + Moving cards
  let stdR   = rates.standard
  const pacR = rates.pac      // PAC is always exempt from offers

  if (activeOffer === 'ff') {
    decoyR = 35; deepR = 35; stdR = 35
  }
  if (activeOffer === 'barter') {
    decoyR = barterRate; deepR = barterRate; stdR = barterRate
  }

  // ── Deep / Deluxe / Moving hours ──────────────────────────────────────────
  const deepSpeed = interpolateSpeed(level, 200, 225, 250)
  let rawDeep = sqft / deepSpeed
  if (level === 1) rawDeep *= 1.5

  let deepLo = pricingRoundHours(rawDeep)
  if (sqft <= 1000) deepLo = Math.max(5, deepLo)
  deepLo = Math.max(2, deepLo)
  if (level === 10) deepLo = Math.max(2, deepLo - 0.5)
  const deepHi = deepLo + (level === 1 ? 2 : 1)

  // ── Standard hours ─────────────────────────────────────────────────────────
  const stdSpeed = interpolateSpeed(level, 450, 475, 500)
  let rawStd = sqft / stdSpeed + 0.5

  let stdLo = pricingRoundHours(rawStd)
  if (sqft <= 1000) stdLo = Math.max(2.5, stdLo)
  stdLo = Math.max(2, stdLo)
  if (level === 10) stdLo = Math.max(2, stdLo - 0.5)
  const stdHi = stdLo + 1

  // ── Priority Area Clean hours ──────────────────────────────────────────────
  const pacDef = Math.max(2, pricingRoundHours(stdLo - 1))
  const priRemoved = pacDef >= stdLo   // hide card if can't be < std hours

  const pacOpts = { A: null, B: pacDef, C: null }
  if (!priRemoved) {
    const pl = Math.max(2, pacDef - 1)
    if (pl < stdLo) pacOpts.A = pl
    const pr = pacDef + 1
    if (pr < stdLo) pacOpts.C = pr
  }
  const selectedPacHrs = priRemoved ? null : (pacOpts[priorityOpt] ?? pacDef)

  // ── Flat-dollar discount (military / senior / first-time) ─────────────────
  let disc = 0
  if (activeOffer === 'military')   disc = 25
  else if (activeOffer === 'senior')    disc = 15
  else if (activeOffer === 'firsttime') disc = 20

  // ── Price range builder ────────────────────────────────────────────────────
  const mkRange = (lo, hi, rate, extra = 0) => ({
    lo: pricingRoundToAttractive(Math.max(0, lo * rate - disc - extra)),
    hi: pricingRoundToAttractive(Math.max(0, hi * rate - disc - extra)),
  })

  const decoyPrice  = mkRange(deepLo, deepHi, decoyR)
  const deluxeExtra = (activeOffer === 'deluxe150' ? 150 : 0) + (activeOffer === '3pack' ? 50 : 0)
  const deluxePrice = mkRange(deepLo, deepHi, deepR, deluxeExtra)
  const movingPrice = mkRange(deepLo, deepHi, deepR)
  const stdExtra    = activeOffer === '3pack' ? 25 : 0
  const stdPrice    = mkRange(stdLo, stdHi, stdR, stdExtra)
  const pacPrice    = selectedPacHrs !== null
    ? { lo: pricingRoundToAttractive(selectedPacHrs * pacR), hi: pricingRoundToAttractive(selectedPacHrs * pacR) }
    : null

  // ── Recurring rates ────────────────────────────────────────────────────────
  let moRec, bwRec, wkRec

  if (selectedService === 'priority' && pacPrice) {
    // PAC recurring: fixed step discounts from PAC price
    moRec = pricingRoundToAttractive(Math.max(0, pacPrice.lo - 2))
    bwRec = pricingRoundToAttractive(Math.max(0, moRec - 3))
    wkRec = pricingRoundToAttractive(Math.max(0, bwRec - 5))
  } else {
    // Standard recurring: base on stdLo × monthly rate
    const base = stdLo * rates.monthly - 25
    moRec = pricingRoundToAttractive(Math.max(1, base))
    bwRec = pricingRoundToAttractive(Math.max(1, moRec - 12))
    wkRec = pricingRoundToAttractive(Math.max(1, bwRec - 18))

    // Level-10 edge case: if initial std lower-end ≤ monthly recurring → flat $10 steps
    if (level === 10 && stdPrice.lo <= moRec) {
      moRec = stdPrice.lo - 10
      bwRec = moRec - 10
      wkRec = bwRec - 10
    }
  }

  return {
    // Hours
    deepLo, deepHi,
    stdLo, stdHi,
    pacOpts, pacDef, priRemoved, selectedPacHrs,
    // Prices
    decoyPrice, deluxePrice, movingPrice, stdPrice, pacPrice,
    // Recurring
    moRec, bwRec, wkRec,
    // Savings for Deluxe card
    deluxeSavings: Math.max(0, decoyPrice.lo - deluxePrice.lo),
    // Meta flags
    isSmall:      sqft <= 1000,
    isMaintained: level === 10,
    stdDisabled:  level <= 2,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCalculator() {
  const [sqft,            setSqft]            = useState(0)
  const [level,           setLevel]           = useState(5)
  const [rates,           setRates]           = useState(DEFAULT_RATES)
  const [ratesLocked,     setRatesLocked]     = useState(true)
  const [barterRate,      setBarterRate]      = useState(65)
  const [barterLocked,    setBarterLocked]    = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedFreq,    setSelectedFreq]    = useState('biweekly')
  const [priorityOpt,     setPriorityOpt]     = useState('B')
  const [activeOffer,     setActiveOffer]     = useState(null)
  const [addons,          setAddons]          = useState({ oven: false, fridge: false, windows: false })

  const lastCalc = useMemo(
    () => calcResidential(sqft, level, rates, barterRate, activeOffer, selectedService, priorityOpt),
    [sqft, level, rates, barterRate, activeOffer, selectedService, priorityOpt]
  )

  function updateRate(key, value) {
    setRates(prev => {
      const next = { ...prev, [key]: value }
      // Auto-link PAC to std+3 when standard changes (if within $1 of std+3)
      if (key === 'standard') next.pac = value + 3
      return next
    })
  }

  function toggleAddon(key) {
    setAddons(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleOffer(offerId) {
    setActiveOffer(prev => (prev === offerId ? null : offerId))
  }

  function selectService(id) {
    setSelectedService(prev => (prev === id ? null : id))
  }

  return {
    sqft, setSqft,
    level, setLevel,
    rates, updateRate,
    ratesLocked, setRatesLocked,
    barterRate, setBarterRate,
    barterLocked, setBarterLocked,
    selectedService, selectService,
    selectedFreq, setSelectedFreq,
    priorityOpt, setPriorityOpt,
    activeOffer, toggleOffer,
    addons, toggleAddon,
    lastCalc,
  }
}
