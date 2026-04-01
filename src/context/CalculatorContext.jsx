import { createContext, useContext } from 'react'
import { useCalculator } from '../hooks/useCalculator'

const Ctx = createContext(null)

export function CalculatorProvider({ children }) {
  const value = useCalculator()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCalc() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCalc must be used inside CalculatorProvider')
  return ctx
}
