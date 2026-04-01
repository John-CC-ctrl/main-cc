import { useState } from 'react'
import { useCalc } from '../../../context/CalculatorContext'
import ConfirmRateModal from '../modals/ConfirmRateModal'
import EditBarterModal from '../modals/EditBarterModal'

export default function RatesPanel() {
  const {
    rates, updateRate,
    ratesLocked, setRatesLocked,
    barterRate, setBarterRate,
    barterLocked, setBarterLocked,
    activeOffer,
  } = useCalc()

  const [showRateModal,   setShowRateModal]   = useState(false)
  const [showBarterModal, setShowBarterModal] = useState(false)
  const [collapsed,       setCollapsed]       = useState(false)

  const showBarter = activeOffer === 'barter'

  function handleEditRatesClick() {
    if (ratesLocked) setShowRateModal(true)
    else setRatesLocked(true)   // re-lock
  }

  const lockedRows = [
    { key: 'decoy',    label: 'Regular Deep Clean (Decoy)',       locked: true  },
    { key: 'deep',     label: 'Deluxe Clean / Moving Clean',      locked: true  },
    { key: 'standard', label: 'Standard Clean',                   locked: true  },
    { key: 'pac',      label: 'Priority Area Clean',              locked: false, note: 'Std + $3' },
    { key: 'monthly',  label: 'Monthly Recurring',                locked: false },
    { key: 'biweekly', label: 'Bi-Weekly Recurring',              locked: false },
    { key: 'weekly',   label: 'Weekly Recurring',                 locked: false },
  ]

  return (
    <>
      {showRateModal && (
        <ConfirmRateModal
          onConfirm={() => { setRatesLocked(false); setShowRateModal(false) }}
          onCancel={()  => setShowRateModal(false)}
        />
      )}
      {showBarterModal && (
        <EditBarterModal
          onConfirm={() => { setBarterLocked(false); setShowBarterModal(false) }}
          onCancel={()  => setShowBarterModal(false)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-cc-200 shadow-sm mb-4">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-cc-100">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-cc-400 hover:text-gray-cc-700 transition-colors"
          >
            <span>{collapsed ? '▶' : '▼'}</span>
            Hourly Rates
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleEditRatesClick}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-cc-100 hover:bg-gray-cc-200 text-gray-cc-700 transition-colors"
            >
              {ratesLocked ? '🔓 Edit Rates' : '🔒 Lock Rates'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-gray-cc-400 border-b border-gray-cc-100">
                  <th className="text-left pb-2">Rate Type</th>
                  <th className="text-right pb-2 pr-2">$/hr</th>
                  <th className="text-left pb-2 pl-2 text-gray-cc-400/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {lockedRows.map(row => {
                  const isLocked = row.locked && ratesLocked
                  return (
                    <tr key={row.key} className="border-b border-gray-cc-50 last:border-0">
                      <td className="py-2 pr-4 text-gray-cc-700">
                        {row.label}
                        {row.note && (
                          <span className="ml-1.5 text-xs text-gray-cc-400">({row.note})</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={rates[row.key]}
                          disabled={isLocked}
                          onChange={e => updateRate(row.key, Number(e.target.value))}
                          className={[
                            'w-16 text-right px-2 py-1 rounded-lg border text-sm font-semibold',
                            isLocked
                              ? 'bg-gray-cc-50 border-gray-cc-100 text-gray-cc-400 cursor-not-allowed'
                              : 'bg-white border-gray-cc-200 text-gray-cc-800 focus:border-navy-light focus:outline-none',
                          ].join(' ')}
                        />
                      </td>
                      <td className="py-2 pl-2 text-xs text-gray-cc-400">
                        {row.locked ? (ratesLocked ? '🔒 Locked' : '✏️ Editing') : '✏️ Editable'}
                      </td>
                    </tr>
                  )
                })}

                {/* Barter rate row — only when barter offer active */}
                {showBarter && (
                  <tr className="border-b border-gray-cc-50 bg-orange-cc-bg/30">
                    <td className="py-2 pr-4 text-gray-cc-700 font-semibold">
                      Barter Rate{' '}
                      <span className="text-xs font-normal text-orange-cc">(IMS/ITEX)</span>
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <input
                        type="number"
                        min="1"
                        value={barterRate}
                        disabled={barterLocked}
                        onChange={e => setBarterRate(Number(e.target.value))}
                        className={[
                          'w-16 text-right px-2 py-1 rounded-lg border text-sm font-semibold',
                          barterLocked
                            ? 'bg-gray-cc-50 border-gray-cc-100 text-gray-cc-400 cursor-not-allowed'
                            : 'bg-white border-orange-cc text-gray-cc-800 focus:outline-none',
                        ].join(' ')}
                      />
                    </td>
                    <td className="py-2 pl-2">
                      {barterLocked ? (
                        <button
                          onClick={() => setShowBarterModal(true)}
                          className="text-xs font-semibold text-orange-cc hover:underline"
                        >
                          🔒 Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => setBarterLocked(true)}
                          className="text-xs font-semibold text-gray-cc-400 hover:underline"
                        >
                          🔒 Lock
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
