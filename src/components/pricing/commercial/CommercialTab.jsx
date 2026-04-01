import { useState } from 'react'

export default function CommercialTab() {
  const [sqft,  setSqft]  = useState(0)
  const [rate,  setRate]  = useState(0.12)

  const price = sqft > 0 ? Math.round(sqft * rate) : null

  return (
    <div>
      {/* Inputs */}
      <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm p-5 mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-4">Commercial Property</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-cc-500 mb-1.5">
              Total Square Footage
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 5000"
              value={sqft || ''}
              onChange={e => setSqft(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-gray-cc-200 rounded-lg text-sm focus:outline-none focus:border-navy-light bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-cc-500 mb-1.5">
              Rate Per Square Foot ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={e => setRate(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-gray-cc-200 rounded-lg text-sm focus:outline-none focus:border-navy-light bg-white"
            />
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="bg-white rounded-xl border-2 border-navy shadow-sm p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 mb-3">
          Estimated Price
        </p>
        {price !== null ? (
          <>
            <p className="text-navy font-black text-5xl mb-2">
              ${price.toLocaleString()}
            </p>
            <p className="text-gray-cc-400 text-sm">
              {sqft.toLocaleString()} sq ft × ${rate.toFixed(2)}/sq ft
            </p>
          </>
        ) : (
          <p className="text-gray-cc-400 text-lg font-semibold">
            Enter square footage above
          </p>
        )}
      </div>
    </div>
  )
}
